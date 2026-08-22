from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/vendors", tags=["Vendors"])


def compute_vendor_score(
    vendor: models.Vendor,
    quoted_price: float,
    bid_days: int,
    budget: float,
    performances: List[models.VendorPerformance]
) -> Dict[str, Any]:
    """
    Computes total score (out of 100) = Price(30) + Delivery(25) + Reliability(25) + History(20)
    - Price Score = max(0, 30 * (1 - (quoted_price - budget) / budget)), capped at 30
    - Delivery Score = max(5, 25 * (1 - (bid_days - avg_days) / max(avg_days, 1))), capped at 25
    - Reliability Score = 25 * (vendor.reliability_score / 100)
    - History Score = 20 * (mean of VendorPerformance.value / 100)
    """
    # 1. Price Score (30 max)
    safe_budget = max(budget, 1.0)
    price_variance_ratio = (quoted_price - safe_budget) / safe_budget
    raw_price_score = 30.0 * (1.0 - price_variance_ratio)
    price_score = min(30.0, max(0.0, raw_price_score))
    price_variance_pct = round(price_variance_ratio * 100.0, 2)

    # 2. Delivery Score (25 max, 5 min)
    avg_days = max(1, vendor.avg_delivery_days)
    raw_delivery_score = 25.0 * (1.0 - (bid_days - avg_days) / avg_days)
    delivery_score = min(25.0, max(5.0, raw_delivery_score))

    # 3. Reliability Score (25 max)
    rel_pct = max(0.0, min(100.0, vendor.reliability_score))
    reliability_score = 25.0 * (rel_pct / 100.0)

    # 4. History Score (20 max)
    if performances:
        mean_perf = sum(p.value for p in performances) / len(performances)
    else:
        # Fallback to vendor's baseline reliability
        mean_perf = vendor.reliability_score
    mean_perf = max(0.0, min(100.0, mean_perf))
    history_score = 20.0 * (mean_perf / 100.0)

    total_score = round(price_score + delivery_score + reliability_score + history_score, 2)

    return {
        "scores": {
            "price_score": round(price_score, 2),
            "delivery_score": round(delivery_score, 2),
            "reliability_score": round(reliability_score, 2),
            "history_score": round(history_score, 2),
            "total_score": total_score,
            "price_variance_pct": price_variance_pct
        },
        "history_score_raw": round(mean_perf, 2)
    }


@router.get("", response_model=List[schemas.VendorOut])
def get_vendors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    vendors = db.query(models.Vendor).all()
    results = []
    for v in vendors:
        perf_avg = db.query(func.avg(models.VendorPerformance.value)).filter(
            models.VendorPerformance.vendor_id == v.id
        ).scalar()
        v_out = schemas.VendorOut.model_validate(v)
        v_out.avg_performance_score = round(float(perf_avg), 1) if perf_avg is not None else v.reliability_score
        results.append(v_out)
    return results


@router.get("/recommendations/{pr_id}", response_model=schemas.RecommendationsResponse)
def get_vendor_recommendations(
    pr_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    pr = db.query(models.PurchaseRequest).filter(models.PurchaseRequest.id == pr_id).first()
    if not pr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Purchase request {pr_id} not found"
        )

    bids = db.query(models.VendorBid).filter(models.VendorBid.pr_id == pr.id).all()
    if not bids:
        return schemas.RecommendationsResponse(
            pr_id=pr.id,
            pr_title=pr.title,
            estimated_budget=pr.estimated_budget,
            urgency=pr.urgency,
            department=pr.department,
            recommendations=[]
        )

    recommendations: List[schemas.VendorRecommendation] = []

    for bid in bids:
        vendor = bid.vendor
        performances = db.query(models.VendorPerformance).filter(
            models.VendorPerformance.vendor_id == vendor.id
        ).all()

        score_res = compute_vendor_score(
            vendor=vendor,
            quoted_price=bid.quoted_price,
            bid_days=bid.delivery_days,
            budget=pr.estimated_budget,
            performances=performances
        )

        # Update bid score in DB if needed
        bid.bid_score = score_res["scores"]["total_score"]

        rec = schemas.VendorRecommendation(
            bid_id=bid.id,
            vendor_id=vendor.id,
            vendor_name=vendor.name,
            pricing_tier=vendor.pricing_tier,
            contact_email=vendor.contact_email,
            quoted_price=bid.quoted_price,
            estimated_budget=pr.estimated_budget,
            delivery_days=bid.delivery_days,
            avg_delivery_days=vendor.avg_delivery_days,
            reliability_score=vendor.reliability_score,
            history_score_raw=score_res["history_score_raw"],
            notes=bid.notes,
            scores=schemas.ScoreBreakdown(**score_res["scores"]),
            rank=0
        )
        recommendations.append(rec)

    db.commit()

    # Rank by total score descending
    recommendations.sort(key=lambda x: x.scores.total_score, reverse=True)
    for idx, rec in enumerate(recommendations, start=1):
        rec.rank = idx

    return schemas.RecommendationsResponse(
        pr_id=pr.id,
        pr_title=pr.title,
        estimated_budget=pr.estimated_budget,
        urgency=pr.urgency,
        department=pr.department,
        recommendations=recommendations
    )

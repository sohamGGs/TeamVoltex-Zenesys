import os
import json
import logging
import concurrent.futures
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END

logger = logging.getLogger("procureiq.negotiation")


def call_gemini_with_timeout(prompt: str, timeout_seconds: float = 5.0) -> Optional[str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or "your_gemini_api_key" in api_key.lower():
        return None

    def _worker():
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
                max_output_tokens=200
            )
        )
        return response.text

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_worker)
        try:
            return future.result(timeout=timeout_seconds)
        except Exception as e:
            logger.warning(f"Gemini negotiation LLM call failed or timed out ({timeout_seconds}s): {e}")
            return None


class NegotiationTurn(TypedDict):
    round: int
    speaker: str
    speaker_role: str
    message: str
    offered_price: float
    offered_days: int
    is_fallback: bool


class SingleVendorState(TypedDict):
    vendor_id: int
    vendor_name: str
    pricing_tier: str
    initial_price: float
    initial_days: int
    avg_delivery_days: int
    price_floor: float
    delivery_floor: int
    current_price: float
    current_days: int
    transcript: List[Dict[str, Any]]
    final_price: float
    final_days: int
    is_fallback: bool
    status: str


class GraphNegotiationState(TypedDict):
    pr_id: int
    pr_title: str
    item_description: str
    quantity: int
    estimated_budget: float
    urgency: str
    department: str
    vendors: List[SingleVendorState]
    current_round: int


def node_round_1_buyer(state: GraphNegotiationState) -> GraphNegotiationState:
    updated_vendors = []
    for v in state["vendors"]:
        initial_price = v["initial_price"]
        initial_days = v["initial_days"]
        budget = state["estimated_budget"]

        prompt = f"""
You are the Chief Procurement Buyer Agent for NetSuite ERP.
Generate an opening counter-offer (Round 1 of 3) for vendor "{v['vendor_name']}" ({v['pricing_tier']}).
PR Title: {state['pr_title']}
Budget: ${budget}
Vendor Initial Quote: ${initial_price} with {initial_days} days SLA.

Goal: Politely but firmly negotiate a lower price (~10-15% below quote) and faster delivery.
Return raw JSON:
{{
  "message": "<1-2 sentence professional procurement opening offer>",
  "offered_price": <target price number>,
  "offered_days": <target days integer>
}}
"""
        llm_raw = call_gemini_with_timeout(prompt, timeout_seconds=5.0)
        parsed = None
        if llm_raw:
            try:
                parsed = json.loads(llm_raw)
            except Exception:
                parsed = None

        if parsed and "offered_price" in parsed and "message" in parsed:
            target_price = round(float(parsed["offered_price"]), 2)
            target_price = max(v["price_floor"], min(initial_price * 0.95, target_price))
            target_days = max(v["delivery_floor"], int(parsed.get("offered_days", initial_days - 1)))
            message = str(parsed["message"])
            is_fb = False
        else:
            target_price = round(initial_price * 0.88, 2)
            target_days = max(v["delivery_floor"], initial_days - 1)
            message = f"We are reviewing quotations for {state['pr_title']}. We can execute an immediate award if you can adjust pricing to ${target_price:,.2f} with a {target_days}-day delivery window."
            is_fb = True

        turn = {
            "round": 1,
            "speaker": "BuyerAgent (ProcureIQ AI)",
            "speaker_role": "buyer",
            "message": message,
            "offered_price": target_price,
            "offered_days": target_days,
            "is_fallback": is_fb
        }
        v["current_price"] = target_price
        v["current_days"] = target_days
        v["transcript"].append(turn)
        updated_vendors.append(v)

    return {**state, "vendors": updated_vendors, "current_round": 1}


def node_round_2_vendor(state: GraphNegotiationState) -> GraphNegotiationState:
    updated_vendors = []
    for v in state["vendors"]:
        tier = v["pricing_tier"]
        initial_price = v["initial_price"]
        initial_days = v["initial_days"]
        price_floor = v["price_floor"]
        delivery_floor = v["delivery_floor"]
        buyer_turn = v["transcript"][-1]
        buyer_price = buyer_turn["offered_price"]
        buyer_days = buyer_turn["offered_days"]

        tier_persona = ""
        if tier == "Enterprise Tier-1":
            tier_persona = "Enterprise Tier-1: Firm on price (minimal discount 3-6%), highlighting ISO quality, premium warranty and SLA reliability. Flexible on expediting delivery."
        elif tier == "Economy Tier":
            tier_persona = "Economy Tier: Highly price-flexible (can offer 10-14% discount towards price floor), but strict on delivery scheduling (cannot expedite easily)."
        else:
            tier_persona = "Mid-Tier: Balanced approach, offering a 7-10% discount in exchange for fast PO confirmation."

        prompt = f"""
You are the automated Vendor Sales Agent for "{v['vendor_name']}".
Tier: {tier} ({tier_persona})
Your Initial Quote: ${initial_price}, {initial_days} days.
Your Secret Price Floor: ${price_floor} (DO NOT GO BELOW THIS)
Your Delivery Floor: {delivery_floor} days.

Buyer just offered: ${buyer_price} and {buyer_days} days.
Generate your Round 2 Counter-Offer. Return raw JSON:
{{
  "message": "<1-2 sentence professional vendor response with one line of reasoning>",
  "counter_price": <counter price number >= {price_floor}>,
  "counter_days": <counter delivery days integer >= {delivery_floor}>
}}
"""
        llm_raw = call_gemini_with_timeout(prompt, timeout_seconds=5.0)
        parsed = None
        if llm_raw:
            try:
                parsed = json.loads(llm_raw)
            except Exception:
                parsed = None

        if parsed and "counter_price" in parsed and "message" in parsed:
            counter_p = max(price_floor, float(parsed["counter_price"]))
            counter_d = max(delivery_floor, int(parsed.get("counter_days", initial_days)))
            msg = str(parsed["message"])
            is_fb = False
        else:
            if tier == "Enterprise Tier-1":
                counter_p = round(initial_price * 0.95, 2)
                counter_d = max(delivery_floor, initial_days - 1)
                msg = f"Given our Tier-1 ISO quality assurance and full 2-year warranty, our best concession is ${counter_p:,.2f} with {counter_d}-day expedited delivery."
            elif tier == "Economy Tier":
                counter_p = round(initial_price * 0.88, 2)
                counter_d = initial_days
                msg = f"We can aggressively discount to ${counter_p:,.2f} to win this order, though our standard {counter_d}-day logistics window remains fixed."
            else:
                counter_p = round(initial_price * 0.92, 2)
                counter_d = max(delivery_floor, initial_days - 1)
                msg = f"In appreciation of a direct award, we can meet at ${counter_p:,.2f} and commit to delivery within {counter_d} business days."
            is_fb = True

        turn = {
            "round": 2,
            "speaker": f"VendorAgent: {v['vendor_name']}",
            "speaker_role": "vendor",
            "message": msg,
            "offered_price": round(counter_p, 2),
            "offered_days": int(counter_d),
            "is_fallback": is_fb
        }
        v["current_price"] = counter_p
        v["current_days"] = counter_d
        v["transcript"].append(turn)
        updated_vendors.append(v)

    return {**state, "vendors": updated_vendors, "current_round": 2}


def node_round_3_resolution(state: GraphNegotiationState) -> GraphNegotiationState:
    updated_vendors = []
    for v in state["vendors"]:
        initial_price = v["initial_price"]
        initial_days = v["initial_days"]
        price_floor = v["price_floor"]
        delivery_floor = v["delivery_floor"]
        v_counter_price = v["current_price"]
        v_counter_days = v["current_days"]

        prompt = f"""
You are the Chief Procurement Buyer Agent for NetSuite ERP.
Final Round (Round 3 of 3) with vendor "{v['vendor_name']}".
Vendor countered with: ${v_counter_price} and {v_counter_days} days.

Review the counter. Either accept or make a final slight adjustment.
Return raw JSON:
{{
  "buyer_closing_message": "<1 sentence final buyer agreement or closing confirmation>",
  "vendor_final_message": "<1 sentence final vendor acceptance and contract lock confirmation>",
  "final_price": <final price number >= {price_floor}>,
  "final_days": <final days integer >= {delivery_floor}>
}}
"""
        llm_raw = call_gemini_with_timeout(prompt, timeout_seconds=5.0)
        parsed = None
        if llm_raw:
            try:
                parsed = json.loads(llm_raw)
            except Exception:
                parsed = None

        if parsed and "final_price" in parsed:
            final_p = max(price_floor, float(parsed["final_price"]))
            final_d = max(delivery_floor, int(parsed.get("final_days", v_counter_days)))
            buyer_msg = str(parsed.get("buyer_closing_message", f"Terms accepted at ${final_p:,.2f} with {final_d}-day delivery SLA."))
            vendor_msg = str(parsed.get("vendor_final_message", f"Confirmed and locked for NetSuite Purchase Order release."))
            is_fb = False
        else:
            final_p = v_counter_price
            final_d = v_counter_days
            buyer_msg = f"We accept your revised quotation of ${final_p:,.2f} with guaranteed {final_d}-day delivery."
            vendor_msg = f"Confirmed. We have reserved inventory and await formal NetSuite PO issuance."
            is_fb = True

        buyer_turn = {
            "round": 3,
            "speaker": "BuyerAgent (ProcureIQ AI)",
            "speaker_role": "buyer",
            "message": buyer_msg,
            "offered_price": round(final_p, 2),
            "offered_days": int(final_d),
            "is_fallback": is_fb
        }
        vendor_turn = {
            "round": 3,
            "speaker": f"VendorAgent: {v['vendor_name']}",
            "speaker_role": "vendor",
            "message": vendor_msg,
            "offered_price": round(final_p, 2),
            "offered_days": int(final_d),
            "is_fallback": is_fb
        }
        v["transcript"].append(buyer_turn)
        v["transcript"].append(vendor_turn)
        v["final_price"] = round(final_p, 2)
        v["final_days"] = int(final_d)
        v["status"] = "completed"
        updated_vendors.append(v)

    return {**state, "vendors": updated_vendors, "current_round": 3}


# Build LangGraph StateGraph
def create_negotiation_graph():
    builder = StateGraph(GraphNegotiationState)
    builder.add_node("round_1_buyer", node_round_1_buyer)
    builder.add_node("round_2_vendor", node_round_2_vendor)
    builder.add_node("round_3_resolution", node_round_3_resolution)

    builder.set_entry_point("round_1_buyer")
    builder.add_edge("round_1_buyer", "round_2_vendor")
    builder.add_edge("round_2_vendor", "round_3_resolution")
    builder.add_edge("round_3_resolution", END)

    return builder.compile()


compiled_graph = create_negotiation_graph()


def run_multi_agent_negotiation(
    pr_data: Dict[str, Any],
    top_vendors_data: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Executes a 3-round LangGraph negotiation across the top 3 vendors.
    Guaranteed per-call 5s timeout with resilient fallback.
    """
    vendor_states: List[SingleVendorState] = []
    for v in top_vendors_data:
        quoted_price = float(v["quoted_price"])
        delivery_days = int(v["delivery_days"])
        avg_days = int(v.get("avg_delivery_days", delivery_days))

        price_floor = round(quoted_price * 0.85, 2)
        delivery_floor = max(1, avg_days - 1)

        vendor_states.append({
            "vendor_id": v["vendor_id"],
            "vendor_name": v["vendor_name"],
            "pricing_tier": v.get("pricing_tier", "Mid-Tier"),
            "initial_price": quoted_price,
            "initial_days": delivery_days,
            "avg_delivery_days": avg_days,
            "price_floor": price_floor,
            "delivery_floor": delivery_floor,
            "current_price": quoted_price,
            "current_days": delivery_days,
            "transcript": [],
            "final_price": quoted_price,
            "final_days": delivery_days,
            "is_fallback": False,
            "status": "completed"
        })

    initial_state: GraphNegotiationState = {
        "pr_id": pr_data.get("id", 0),
        "pr_title": pr_data.get("title", "Purchase Request"),
        "item_description": pr_data.get("item_description", ""),
        "quantity": pr_data.get("quantity", 1),
        "estimated_budget": float(pr_data.get("estimated_budget", 0.0)),
        "urgency": pr_data.get("urgency", "Standard"),
        "department": pr_data.get("department", "Operations"),
        "vendors": vendor_states,
        "current_round": 0
    }

    try:
        final_state = compiled_graph.invoke(initial_state)
        return final_state
    except Exception as e:
        logger.error(f"LangGraph execution error, applying fallback: {e}")
        # Ensure complete fallback return so endpoint NEVER returns 500
        fallback_vendors = []
        for vs in vendor_states:
            init_p = vs["initial_price"]
            init_d = vs["initial_days"]
            fallback_transcript = [
                {
                    "round": 1,
                    "speaker": "BuyerAgent (ProcureIQ AI)",
                    "speaker_role": "buyer",
                    "message": f"We are reviewing quotation terms for {initial_state['pr_title']}.",
                    "offered_price": init_p,
                    "offered_days": init_d,
                    "is_fallback": True
                },
                {
                    "round": 2,
                    "speaker": f"VendorAgent: {vs['vendor_name']}",
                    "speaker_role": "vendor",
                    "message": "Negotiation unavailable — original quote retained under standard procurement terms.",
                    "offered_price": init_p,
                    "offered_days": init_d,
                    "is_fallback": True
                },
                {
                    "round": 3,
                    "speaker": "System Note",
                    "speaker_role": "buyer",
                    "message": "Original quote retained as binding benchmark.",
                    "offered_price": init_p,
                    "offered_days": init_d,
                    "is_fallback": True
                }
            ]
            vs["transcript"] = fallback_transcript
            vs["final_price"] = init_p
            vs["final_days"] = init_d
            vs["status"] = "held"
            vs["is_fallback"] = True
            fallback_vendors.append(vs)
        return {**initial_state, "vendors": fallback_vendors, "current_round": 3}

// src/components/BillTemplate.jsx

function formatBillNumber(billId) {
  const padded = String(billId).padStart(4, "0");
  return padded;
}

function BillTemplate({ data }) {
  if (!data) return null;

  const { bill, items, owner_name, total, include_pass } = data;

  const qtyDisplay = (q) => {
    const n = Number(q);
    if (Number.isFinite(n)) return String(Math.round(n));
    return q ?? "";
  };

  const billDate = bill?.bill_timestamp
    ? new Date(bill.bill_timestamp)
    : new Date();

  const formattedDate = billDate.toLocaleDateString("en-IN");
  const formattedTime = billDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalAmount = bill
    ? Number(bill.total_amount || 0).toFixed(2)
    : Number(total || 0).toFixed(2);

  return (
    <div className="slip-wrapper">
      <div className="slip-paper">
        {/* Header */}
        <div className="slip-header">
          <h1>JOBIN AGENCIES</h1>
        </div>

        {/* Bill meta */}
        <div className="slip-meta">
          <div>
            <span className="label">No:</span>
            <span>
              {bill ? formatBillNumber(bill.daily_bill_no) : "PREVIEW"}
            </span>
          </div>
          <div className="slip-datetime">
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
          </div>
        </div>

        <div className="slip-separator" />

        {/* Party / vehicle */}
        <div className="slip-party">
          <div>
            <span className="label">Customer:</span>
            <span>{owner_name}</span>
          </div>
          <div>
            <span className="label">Vehicle:</span>
            <span>{bill?.vehicle_number || data.vehicle_number || "-"}</span>
          </div>
        </div>

        <div className="slip-separator dotted" />

        {/* Items list */}
        <div className="slip-items">
          {items.map((item, idx) => (
            <div
              className="slip-item-row item-block"
              key={item.transaction_id || idx}
            >
              <div className="item-block-left">
                <div className="item-material">{item.material_name}</div>
                <div className="item-mattam">
                  {(() => {
                    // If mattamDisplay is provided, use it directly
                    if (item.mattamDisplay) {
                      return item.mattamDisplay;
                    }

                    const name = (item.material_name || "").toUpperCase();
                    const unit = (item.unit || "").toUpperCase();

                    // Logic: If it's a countable item (Unit is NO)
                    // or the name implies it's a countable item (BRICKS, STONE, CEMENT)
                    const isNoUnit =
                      unit === "NO" ||
                      name.includes("BRICKS") ||
                      name.includes("STONE") ||
                      name.includes("CEMENT");

                    if (isNoUnit) {
                      return qtyDisplay(item.quantity);
                    }

                    // Standard Mattam logic for Sand/Dust
                    const mattamRaw = item.mattam;
                    const mattamStr =
                      mattamRaw == null ? "" : String(mattamRaw).trim();

                    // If it's empty and NOT a "NO" unit item, show label
                    if (mattamStr === "") return "மட்டம்";

                    const mattamNum = Number(mattamStr);
                    if (Number.isFinite(mattamNum)) {
                      if (mattamNum === 0) return qtyDisplay(item.quantity);
                      return "மட்டம்" + " + " + `${Math.round(mattamNum)}`;
                    }

                    return mattamStr;
                  })()}
                </div>
              </div>

              <div className="item-block-right">
                <div className="small-row">
                  Qty: <strong>{qtyDisplay(item.quantity)}</strong>
                </div>
                <div className="small-row">
                  Rate: <strong>₹{Number(item.rate_at_sale).toFixed(0)}</strong>
                </div>
                <div className="small-row">
                  Amt: <strong>₹{Number(item.total_cost).toFixed(0)}</strong>
                </div>
              </div>
            </div>
          ))}

          {/* Pass charge if included */}
          {include_pass && (
            <div className="item-block-right">
              <div className="small-row">
                +Pass: <strong>₹200</strong>
              </div>
            </div>
          )}
        </div>

        <div className="slip-separator" />

        {/* Total */}
        <div className="slip-total-row">
          <span className="label">Total:</span>
          <span className="amount">₹ {totalAmount}</span>
        </div>

        <div className="slip-separator dotted" />
      </div>
    </div>
  );
}

export default BillTemplate;

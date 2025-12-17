// src/components/BillTemplate.jsx

function formatBillNumber(billId, timestamp) {
  const year = new Date(timestamp || Date.now()).getFullYear();
  const padded = String(billId).padStart(4, "0");
  // JA = Jobin Agency
  return `JA-${year}-${padded}`;
}

function BillTemplate({ data }) {
  if (!data) return null;

  const { bill, items, owner_name } = data;

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

  const totalAmount = Number(bill.total_amount || 0).toFixed(2);

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
            <span className="label">Bill No:</span>
            <span>{formatBillNumber(bill.bill_id, bill.bill_timestamp)}</span>
          </div>
          <div>
            <span className="label">Date:</span>
            <span>{formattedDate}</span>
          </div>
          <div>
            <span className="label">Time:</span>
            <span>{formattedTime}</span>
          </div>
        </div>

        <div className="slip-separator" />

        {/* Party / vehicle */}
        <div className="slip-party">
          <div>
            <span className="label">Owner:</span>
            <span>{owner_name}</span>
          </div>
          <div>
            <span className="label">Vehicle:</span>
            <span>{bill.vehicle_number}</span>
          </div>
        </div>

        <div className="slip-separator dotted" />

        {/* Items list */}
        <div className="slip-items">
          <div className="slip-items-header">
            <span className="col-material">Material</span>
            <span className="col-qty">Qty</span>
            <span className="col-rate">Rate</span>
            <span className="col-amt">Amt</span>
          </div>

          {items.map((item, idx) => (
            <div
              className="slip-item-row item-block"
              key={item.transaction_id || idx}
            >
              <div className="item-block-left">
                <div className="item-material">{item.material_name}</div>
                <div className="item-mattam">
                  {(() => {
                    const name = (item.material_name || "").toLowerCase();
                    const isCement = name.includes("cement");
                    if (isCement) return qtyDisplay(item.quantity);
                    return item.unitType === "perukam"
                      ? item.mattam || ""
                      : `மட்டம்${item.mattam ? ` + ${item.mattam}` : ""}`;
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

/* Added slip-mattam-large class for large display */

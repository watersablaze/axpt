import { useEffect, useState } from "react";
import { getGoldPrice } from "@/lib/contract";

export default function GoldPrice() {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    async function fetchPrice() {
      const price = await getGoldPrice();
      setPrice(price);
    }
    fetchPrice();
  }, []);

  return (
    <div>
      <h2>Gold Price (USD)</h2>
      {price ? <p>{price} USD per gram</p> : <p>Loading...</p>}
    </div>
  );
}
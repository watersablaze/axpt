import { useEffect, useState } from "react";
import { getGoldPrice } from "@/lib/contract";

export default function GoldPrice() {
  const [price, setPrice] = useState<string | null>(null); // ✅ Set type explicitly

  useEffect(() => {
    async function fetchPrice() {
      const goldPrice: string = await getGoldPrice(); // ✅ Ensure type consistency
      setPrice(goldPrice);
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
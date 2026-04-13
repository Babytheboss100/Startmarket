export function calculateFees(totalValue) {
  const rate = totalValue < 1_000_000 ? 0.05 : 0.03;
  return { rate, ratePercent: rate * 100, sellerFee: totalValue * rate, buyerFee: totalValue * rate, totalFee: totalValue * rate * 2, netToSeller: totalValue - totalValue * rate, totalForBuyer: totalValue + totalValue * rate };
}

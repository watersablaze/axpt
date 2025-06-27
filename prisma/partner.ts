export const findOrCreatePartner = async (prisma, partnerData) => {
  const existing = await prisma.partner.findUnique({ where: { slug: partnerData.slug } });
  if (existing) return existing;

  return await prisma.partner.create({ data: partnerData });
};
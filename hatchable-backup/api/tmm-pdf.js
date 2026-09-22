export const access = "public";
export const methods = ["GET"];
const MANUAL_URL = "https://www2.gov.bc.ca/assets/gov/driving-and-transportation/transportation-infrastructure/engineering-standards-and-guidelines/traffic-engineering-and-safety/traffic-engineering/traffic-management-and-traffic-control/2020-traffic-control-manual/2020-traffic-management-manual-for-work-on-roadways.pdf";
export default async function (req, res) {
  const upstream = await fetch(MANUAL_URL);
  if (!upstream.ok) return res.status(502).json({ error: "Official TMM manual unavailable" });
  const bytes = new Uint8Array(await upstream.arrayBuffer());
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Content-Disposition", "inline; filename=\"2020-tmm.pdf\"");
  return res.send(bytes);
}
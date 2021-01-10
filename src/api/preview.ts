import { NextApiRequest, NextApiResponse } from "next";

/**
 * Return endpoint to validate token, set preview and redirect. 
 * Default redirect is to req.query.slug
 */
export default (
  previewToken: string,
  data?: (req: NextApiRequest) => any,
  redirect?: (req: NextApiRequest) => string
) => (req: NextApiRequest, res: NextApiResponse<{}>) => {
  if (req.query.secret !== previewToken) {
    return res.status(401).json({ message: "Invalid token" });
  }

  res.setPreviewData(data ? data(req) : {});
  res.redirect(redirect ? redirect(req) : `/${req.query.slug}`);
};

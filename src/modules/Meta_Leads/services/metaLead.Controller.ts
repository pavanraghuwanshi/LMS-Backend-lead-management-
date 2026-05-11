export const syncMetaLeads = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const connection =
      await MetaConnection.findOne({
        userId: user._id,
      });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "Meta account not connected",
      });
    }

    const allLeads: any[] = [];

    for (const page of connection.pages) {

      // ============================
      // GET FORMS
      // ============================

      const forms =
        await getLeadForms(
          page.pageId,
          page.pageAccessToken
        );

      // ============================
      // LOOP FORMS
      // ============================

      for (const form of forms) {

        const leads =
          await getFormLeads(
            form.id,
            page.pageAccessToken
          );

        allLeads.push({
          formId: form.id,
          formName: form.name,
          leads,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Meta leads synced successfully",
      totalForms: allLeads.length,
      data: allLeads,
    });

  } catch (error: any) {

    console.error(
      "Sync Meta Leads Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error:
        error.response?.data ||
        error.message,
    });
  }
};


export const verifyMetaWebhook = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {

    const mode =
      req.query["hub.mode"];

    const token =
      req.query["hub.verify_token"];

    const challenge =
      req.query["hub.challenge"];

    if (
      mode === "subscribe" &&
      token ===
        process.env.META_VERIFY_TOKEN
    ) {

      console.log(
        "META WEBHOOK VERIFIED"
      );

      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);

  } catch (error) {

    return res.sendStatus(500);
  }
};


export const receiveMetaWebhook = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {

    console.log(
      "META WEBHOOK RECEIVED"
    );

    console.log(
      JSON.stringify(req.body, null, 2)
    );

    // realtime lead data comes here

    return res.sendStatus(200);

  } catch (error) {

    console.error(
      "Receive Webhook Error:",
      error
    );

    return res.sendStatus(500);
  }
};
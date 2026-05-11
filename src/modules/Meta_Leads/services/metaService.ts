import axios from "axios";

const GRAPH_URL = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION}`;



// ============================================
// GET META USER
// ============================================

export const getMetaUser = async (
  accessToken: string
) => {
  const response = await axios.get(
    `${GRAPH_URL}/me`,
    {
      params: {
        fields: "id,name,email",
        access_token: accessToken,
      },
    }
  );

  return response.data;
};



// ============================================
// GET USER PAGES
// ============================================

export const getUserPages = async (
  accessToken: string
) => {
  const response = await axios.get(
    `${GRAPH_URL}/me/accounts`,
    {
      params: {
        access_token: accessToken,
      },
    }
  );

  return response.data.data;
};



// ============================================
// GET PAGE LEAD FORMS
// ============================================

export const getLeadForms = async (
  pageId: string,
  pageAccessToken: string
) => {
  const response = await axios.get(
    `${GRAPH_URL}/${pageId}/leadgen_forms`,
    {
      params: {
        access_token: pageAccessToken,
      },
    }
  );

  return response.data.data;
};



// ============================================
// GET FORM LEADS
// ============================================

export const getFormLeads = async (
  formId: string,
  pageAccessToken: string
) => {
  const response = await axios.get(
    `${GRAPH_URL}/${formId}/leads`,
    {
      params: {
        access_token: pageAccessToken,
      },
    }
  );

  return response.data.data;
};



// ============================================
// SUBSCRIBE PAGE WEBHOOK
// ============================================

export const subscribePageWebhook = async (
  pageId: string,
  pageAccessToken: string
) => {
  const response = await axios.post(
    `${GRAPH_URL}/${pageId}/subscribed_apps`,
    {},
    {
      params: {
        subscribed_fields: "leadgen",
        access_token: pageAccessToken,
      },
    }
  );

  return response.data;
};
import axios from "axios";

export const exchangeLongLivedToken = async (
  shortToken: string
) => {

  const response = await axios.get(
    `https://graph.facebook.com/${process.env.META_GRAPH_VERSION}/oauth/access_token`,
    {
      params: {
        grant_type: "fb_exchange_token",

        client_id:
          process.env.META_APP_ID,

        client_secret:
          process.env.META_APP_SECRET,

        fb_exchange_token:
          shortToken,
      },
    }
  );

  return response.data;
};
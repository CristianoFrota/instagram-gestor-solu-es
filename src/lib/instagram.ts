const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getCredentials() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;

  if (!accessToken || !igUserId) {
    throw new Error(
      "META_ACCESS_TOKEN e IG_USER_ID precisam estar configurados nas variáveis de ambiente."
    );
  }

  return { accessToken, igUserId };
}

/**
 * Publica uma imagem no Instagram via Graph API em duas etapas:
 * cria o container de mídia e depois publica.
 * https://developers.facebook.com/docs/instagram-platform/content-publishing
 */
export async function publishImagePost(params: {
  imageUrl: string;
  caption: string;
}): Promise<{ igMediaId: string }> {
  const { accessToken, igUserId } = getCredentials();

  const createParams = new URLSearchParams({
    image_url: params.imageUrl,
    caption: params.caption,
    access_token: accessToken,
  });
  const createRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: createParams,
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.id) {
    throw new Error(
      `Falha ao criar container de mídia: ${JSON.stringify(createData)}`
    );
  }

  const publishParams = new URLSearchParams({
    creation_id: createData.id,
    access_token: accessToken,
  });
  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishParams,
    }
  );
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Falha ao publicar mídia: ${JSON.stringify(publishData)}`);
  }

  return { igMediaId: publishData.id as string };
}

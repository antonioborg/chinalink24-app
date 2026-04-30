const handler = async (event) => {
  const { user } = JSON.parse(event.body || '{}');
  const appMetadata = user?.app_metadata || {};
  const existingRoles = Array.isArray(appMetadata.roles) ? appMetadata.roles : [];

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        ...appMetadata,
        roles: existingRoles.length ? existingRoles : ['client'],
      },
      user_metadata: user?.user_metadata || {},
    }),
  };
};

export { handler };

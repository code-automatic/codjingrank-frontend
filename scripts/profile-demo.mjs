export function createProfileDemo(spec) {
  const login = structuredClone(
    spec.paths["/api/v1/auth/login"].post.responses["200"].content[
      "application/json"
    ].example.data,
  );
  let user = { ...login.user, avatarUrl: null };
  if (process.env.MOCK_PROFILE_ROLE === "admin") {
    user = { ...user, role: "admin", fullName: "Admin Demo" };
  }
  const success = (data) => ({
    status: 200,
    body: { status: "success", code: 200, message: "Demo profile", data },
  });
  const failure = (status, error) => ({
    status,
    body: {
      status: "error",
      code: status,
      message: error,
      error,
      details: null,
    },
  });
  return async (req, url) => {
    if (url.pathname === "/api/v1/auth/login" && req.method === "POST")
      return success({ ...login, user });
    if (
      url.pathname !== "/api/v1/users/me" ||
      !["GET", "PATCH"].includes(req.method)
    )
      return null;
    if (req.headers.authorization !== `Bearer ${login.accessToken}`)
      return failure(401, "UNAUTHORIZED");
    if (req.method === "PATCH") {
      let body = "";
      try {
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 12000) return failure(413, "PAYLOAD_TOO_LARGE");
        }
        const patch = JSON.parse(body);
        if (
          !patch ||
          typeof patch !== "object" ||
          Array.isArray(patch) ||
          !Object.keys(patch).length ||
          Object.keys(patch).some(
            (key) => !["fullName", "bio", "avatarUrl"].includes(key),
          )
        )
          return failure(400, "VALIDATION_ERROR");
        for (const [key, max] of [
          ["fullName", 120],
          ["bio", 1000],
          ["avatarUrl", 2048],
        ]) {
          const value = patch[key];
          if (
            value !== undefined &&
            value !== null &&
            (typeof value !== "string" ||
              [...value].length > max ||
              (key === "fullName" && !value.trim()))
          )
            return failure(400, "VALIDATION_ERROR");
        }
        if (patch.avatarUrl) {
          const source = new URL(patch.avatarUrl);
          if (
            !["http:", "https:"].includes(source.protocol) ||
            source.username ||
            source.password
          )
            return failure(400, "VALIDATION_ERROR");
        }
        user = { ...user, ...patch, updatedAt: new Date().toISOString() };
      } catch {
        return failure(400, "VALIDATION_ERROR");
      }
    }
    return success({ user });
  };
}

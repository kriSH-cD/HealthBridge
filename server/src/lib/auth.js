import { prisma } from "../db.js";
import { HttpError } from "./http.js";
import { decodeToken } from "./security.js";
import { userInclude } from "./serialize.js";

/** Sets req.user from the Bearer token or responds 401. */
export async function requireUser(req, _res, next) {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token && decodeToken(token);
  if (!payload?.sub || payload.type === "refresh") throw new HttpError(401, "Could not validate credentials");

  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) }, include: userInclude });
  if (!user) throw new HttpError(401, "Could not validate credentials");
  if (!user.is_active) throw new HttpError(400, "Inactive user account");
  req.user = user;
  next();
}

/** requireUser + role check (403). Use as: router.get(path, ...requireRoles("DOCTOR"), handler) */
export const requireRoles = (...roles) => [
  requireUser,
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, `Access forbidden: requires one of roles ${JSON.stringify(roles)}`);
    }
    next();
  },
];

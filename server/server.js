const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT || 4000);
const dataDir = path.join(__dirname, "data");
const uploadsDir = path.join(__dirname, "uploads");
const usersFile = path.join(dataDir, "users.json");
const adminFile = path.join(dataDir, "admin.json");
const otpSessions = new Map();

let mongoClient;
let mongoDb;
let mongoIndexesReady = false;
let mongoSeedReady = false;

app.use(express.json({ limit: "75mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", async (_req, res) => {
  const database = (await getDatabase()) ? "mongodb" : "json";
  res.json({ ok: true, service: "void-store", database });
});

app.get("/api/catalog", handlePublicCatalog);
app.post("/api/auth/otp/send", handleSendOtp);
app.post("/api/auth/otp/verify", handleVerifyOtp);
app.post("/api/auth/login", handleLogin);
app.post("/api/auth/addresses", requireAuth, handleAddAddress);
app.post("/api/orders", requireAuth, handleCreateOrder);
app.get("/api/admin/dashboard", requireAuth, requireAdmin, handleAdminDashboard);
app.get("/api/admin/catalog", requireAuth, requireAdmin, handleAdminCatalog);
app.put("/api/admin/catalog", requireAuth, requireAdmin, handleSaveAdminCatalog);
app.post("/api/admin/uploads", requireAuth, requireAdmin, express.raw({ type: "image/*", limit: "8mb" }), handleAdminUpload);
app.post("/api/otp/send", handleSendOtp);
app.post("/api/otp/verify", handleVerifyOtp);

async function handleSendOtp(req, res) {
  const mobile = normalizeIndianMobile(req.body.mobile);
  const mode = req.body.mode === "register" ? "register" : "login";
  const name = normalizeName(req.body.name);
  const password = String(req.body.password || "");
  const user = mobile ? await findUserByMobile(mobile) : null;

  if (!mobile) {
    return res.status(400).json({ message: "Enter a valid 10-digit mobile number." });
  }

  if (mode === "register" && password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  if (mode === "register" && name.length < 2) {
    return res.status(400).json({ message: "Enter your name." });
  }

  if (mode === "register" && user) {
    return res.status(409).json({ message: "An account already exists for this mobile number." });
  }

  if (mode === "login") {
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ message: "Mobile number or password is incorrect." });
    }
  }

  try {
    const otpSession = await sendOtp(mobile);
    otpSessions.set(mobile, {
      ...otpSession,
      mode,
      name: mode === "register" ? name : "",
      passwordHash: mode === "register" ? hashPassword(password) : "",
      expiresAt: Date.now() + Number(process.env.OTP_TTL_MS || 300000)
    });

    return res.json({
      message: "OTP sent.",
      provider: getOtpProvider(),
      expiresInMs: Number(process.env.OTP_TTL_MS || 300000)
    });
  } catch (error) {
    return res.status(502).json({ message: getProviderErrorMessage(error) });
  }
}

async function handleLogin(req, res) {
  const mobile = normalizeIndianMobile(req.body.mobile);
  const password = String(req.body.password || "");
  const user = mobile ? await findUserByMobile(mobile) : null;

  if (!mobile) {
    return res.status(400).json({ message: "Enter a valid 10-digit mobile number." });
  }

  if (!password) {
    return res.status(400).json({ message: "Enter your password." });
  }

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ message: "Mobile number or password is incorrect." });
  }

  return res.json({
    message: "Login successful.",
    token: signToken(user),
    user: toPublicUser(user)
  });
}

async function handleVerifyOtp(req, res) {
  const mobile = normalizeIndianMobile(req.body.mobile);
  const otp = String(req.body.otp || "").trim();
  const session = otpSessions.get(mobile);

  if (!mobile) {
    return res.status(400).json({ message: "Enter a valid 10-digit mobile number." });
  }

  if (!/^\d{4,8}$/.test(otp)) {
    return res.status(400).json({ message: "Enter the OTP sent to your mobile number." });
  }

  if (!session || session.expiresAt < Date.now()) {
    otpSessions.delete(mobile);
    return res.status(400).json({ message: "OTP session not found or expired." });
  }

  try {
    const isApproved = await verifyOtp(mobile, otp, session);

    if (!isApproved) {
      return res.status(400).json({ message: "The OTP is incorrect or expired." });
    }

    let user = await findUserByMobile(mobile);

    if (session.mode === "register") {
      user = await createUser({
        id: crypto.randomUUID(),
        name: session.name,
        mobile,
        password: session.passwordHash,
        createdAt: new Date().toISOString()
      });
    }

    if (!user) {
      return res.status(404).json({ message: "Account not found. Please create an account first." });
    }

    otpSessions.delete(mobile);

    return res.json({
      message: "OTP verified.",
      token: signToken(user),
      user: toPublicUser(user)
    });
  } catch (error) {
    return res.status(400).json({ message: getProviderErrorMessage(error) });
  }
}

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.sub);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ user: toPublicUser(user) });
});

async function handleAddAddress(req, res) {
  const address = normalizeAddress(req.body.address);
  const label = String(req.body.label || "Home").trim().replace(/\s+/g, " ").slice(0, 40) || "Home";

  if (address.length < 8) {
    return res.status(400).json({ message: "Enter a complete delivery address." });
  }

  const nextAddress = {
    id: crypto.randomUUID(),
    label,
    address,
    createdAt: new Date().toISOString()
  };
  const user = await addAddressToUser(req.user.sub, nextAddress);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.status(201).json({
    message: "Address saved.",
    address: nextAddress,
    user: toPublicUser(user)
  });
}

async function handleCreateOrder(req, res) {
  const order = normalizeOrder(req.body);

  if (!order.items.length) {
    return res.status(400).json({ message: "Add at least one item before placing an order." });
  }

  if (!order.customer.name || !order.customer.phone || !order.shippingAddress) {
    return res.status(400).json({ message: "Name, phone, and delivery address are required." });
  }

  const user = await addOrderToUser(req.user.sub, order);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.status(201).json({
    message: "Order saved.",
    order,
    user: toPublicUser(user)
  });
}

async function handleAdminDashboard(_req, res) {
  const [users, catalog] = await Promise.all([readAllUsers(), readAdminCatalog()]);
  const orders = users.flatMap((user) =>
    (Array.isArray(user.orders) ? user.orders : []).map((order) => ({
      ...order,
      customerName: user.name || user.mobile || "VOID customer",
      customerMobile: user.mobile
    }))
  );
  const totalRevenue = orders.reduce((sum, order) => sum + parseMoney(order.total || order.amount), 0);
  const pendingOrders = orders.filter((order) => getOrderStatus(order) === "pending").length;
  const refundRequests = users.reduce((sum, user) => sum + (Array.isArray(user.returns) ? user.returns.length : 0), 0);
  const lowStock = catalog.inventory.filter((item) => Number(item.stock || 0) <= Number(item.reorderAt || 0));

  return res.json({
    metrics: {
      revenue: formatCurrency(totalRevenue),
      orders: orders.length,
      customers: users.length,
      pendingOrders,
      refundRequests,
      lowStock: lowStock.length,
      activeCoupons: catalog.coupons.filter((coupon) => coupon.status === "Active").length,
      products: catalog.products.length
    },
    recentOrders: orders
      .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
      .slice(0, 8),
    customers: users.map((user) => ({
      id: user.id,
      name: user.name || "VOID customer",
      mobile: user.mobile,
      createdAt: user.createdAt,
      orders: Array.isArray(user.orders) ? user.orders.length : 0,
      addresses: Array.isArray(user.addresses) ? user.addresses.length : 0,
      rewardPoints: Number(user.rewardPoints || 0)
    })),
    lowStock,
    catalog
  });
}

async function handleAdminCatalog(_req, res) {
  return res.json({ catalog: await readAdminCatalog() });
}

async function handlePublicCatalog(_req, res) {
  const catalog = await readAdminCatalog();
  const visibleCategories = catalog.categories.filter((category) =>
    ["visible", "published", "active"].includes(String(category.status || "Visible").toLowerCase())
  );
  const visibleCategoryNames = new Set(visibleCategories.map((category) => String(category.name || "").toLowerCase()));
  const products = catalog.products.filter((product) => {
    const status = String(product.status || "Published").toLowerCase();
    const category = String(product.category || "").toLowerCase();
    return status === "published" && (!visibleCategoryNames.size || visibleCategoryNames.has(category));
  });

  return res.json({
    catalog: {
      products,
      categories: visibleCategories,
      updatedAt: catalog.updatedAt
    }
  });
}

async function handleSaveAdminCatalog(req, res) {
  const catalog = syncInventoryWithProducts(normalizeAdminCatalog(req.body.catalog || req.body));
  await writeAdminCatalog(catalog);
  return res.json({ message: "Admin data saved.", catalog });
}

async function handleAdminUpload(req, res) {
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  const extension = getImageExtension(contentType);

  if (!extension || !Buffer.isBuffer(req.body) || !req.body.length) {
    return res.status(400).json({ message: "Upload a valid image file." });
  }

  ensureUploadsStore();
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, req.body);

  return res.status(201).json({
    message: "Photo uploaded.",
    url: `/uploads/${fileName}`
  });
}

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ message: "Upload is too large. Use smaller product photos." });
  }

  return res.status(500).json({ message: error?.message || "Server error while saving admin data." });
});

app.listen(port, () => {
  console.log(`VOID store server running on http://127.0.0.1:${port}`);
});

async function sendOtp(mobile) {
  if (getOtpProvider() === "console") {
    const code = process.env.DEV_OTP || String(crypto.randomInt(100000, 999999));
    console.log(`VOID dev OTP for ${mobile}: ${code}`);
    return { code };
  }

  const url = new URL(getMessageCentralUrl("send"));
  url.searchParams.set("countryCode", process.env.MESSAGE_CENTRAL_COUNTRY_CODE || "91");
  url.searchParams.set("customerId", requiredEnv("MESSAGE_CENTRAL_CUSTOMER_ID"));
  url.searchParams.set("flowType", process.env.MESSAGE_CENTRAL_FLOW_TYPE || "SMS");
  url.searchParams.set("mobileNumber", mobile.replace(/^\+91/, ""));

  const data = await requestMessageCentral(url, { method: "POST" });
  const verificationId = data?.data?.verificationId || data?.verificationId;

  if (!verificationId) {
    throw new Error("Message Central did not return a verification ID.");
  }

  return { verificationId };
}

async function verifyOtp(_mobile, otp, session) {
  if (getOtpProvider() === "console") {
    return otp === session.code;
  }

  const url = new URL(getMessageCentralUrl("verify"));
  url.searchParams.set("verificationId", session.verificationId);
  url.searchParams.set("code", otp);

  const data = await requestMessageCentral(url, { method: "GET" });
  const status = String(data?.data?.verificationStatus || data?.verificationStatus || data?.status || "").toLowerCase();

  return status.includes("verified") || status.includes("approved") || data?.responseCode === 200;
}

async function requestMessageCentral(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authToken: requiredEnv("MESSAGE_CENTRAL_AUTH_TOKEN"),
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.responseCode >= 400) {
    throw new Error(data?.message || data?.error || "Message Central OTP request failed.");
  }

  return data;
}

function getMessageCentralUrl(type) {
  const baseUrl = process.env.MESSAGE_CENTRAL_BASE_URL || "https://cpaas.messagecentral.com";
  const pathName =
    type === "send"
      ? process.env.MESSAGE_CENTRAL_SEND_OTP_PATH || "/verification/v3/send"
      : process.env.MESSAGE_CENTRAL_VERIFY_OTP_PATH || "/verification/v3/validateOtp";

  return `${baseUrl.replace(/\/$/, "")}${pathName.startsWith("/") ? pathName : `/${pathName}`}`;
}

function requireAuth(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = jwt.verify(token, requiredEnv("JWT_SECRET"));
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Session expired. Please login again." });
  }
}

function requireAdmin(req, res, next) {
  if (isAdminMobile(req.user.mobile)) {
    return next();
  }

  return res.status(403).json({ message: "Admin access required." });
}

function getAdminMobiles() {
  return String(process.env.ADMIN_MOBILE_NUMBERS || "")
    .split(",")
    .map((entry) => normalizeIndianMobile(entry) || entry.trim())
    .filter(Boolean);
}

function isAdminMobile(mobile) {
  const allowedMobiles = getAdminMobiles();
  return allowedMobiles.length > 0 && allowedMobiles.includes(normalizeIndianMobile(mobile) || mobile);
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      mobile: user.mobile
    },
    requiredEnv("JWT_SECRET"),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");

  if (!salt || !hash) {
    return false;
  }

  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");

  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

function normalizeIndianMobile(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const number = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;

  if (number.length !== 10) {
    return "";
  }

  return `+91${number}`;
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
}

function normalizeAddress(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 240);
}

function normalizeOrder(body) {
  const now = new Date().toISOString();
  const items = Array.isArray(body.items)
    ? body.items.map(normalizeOrderItem).filter((item) => item.name)
    : [];

  return {
    id: `VOID-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    status: "Pending",
    items,
    total: String(body.total || `${items.length} item${items.length === 1 ? "" : "s"}`),
    customer: {
      name: normalizeName(body.customer?.name || body.name),
      phone: String(body.customer?.phone || body.phone || "").trim().slice(0, 20)
    },
    shippingAddress: normalizeAddress(body.shippingAddress || body.address),
    paymentMethod: String(body.paymentMethod || "demo_card").slice(0, 40),
    paymentStatus: "Paid",
    createdAt: now,
    updatedAt: now
  };
}

function normalizeOrderItem(item) {
  const selections = item && typeof item.selections === "object" ? item.selections : {};

  return {
    name: String(item?.name || item?.product || "").trim().slice(0, 120),
    price: String(item?.price || "").trim().slice(0, 40),
    image: String(item?.image || "").trim().slice(0, 500),
    selections
  };
}

function normalizeAdminCatalog(value) {
  const catalog = value && typeof value === "object" ? value : {};
  const fallback = getDefaultAdminCatalog();

  return {
    products: normalizeAdminList(catalog.products, fallback.products),
    inventory: normalizeAdminList(catalog.inventory, fallback.inventory),
    shipping: normalizeAdminList(catalog.shipping, fallback.shipping),
    refunds: normalizeAdminList(catalog.refunds, fallback.refunds),
    coupons: normalizeAdminList(catalog.coupons, fallback.coupons),
    categories: normalizeAdminList(catalog.categories, fallback.categories),
    cms: normalizeAdminList(catalog.cms, fallback.cms),
    reviewVideos: normalizeAdminList(catalog.reviewVideos, fallback.reviewVideos),
    updatedAt: new Date().toISOString()
  };
}

function normalizeAdminList(value, fallback) {
  return Array.isArray(value) ? value.map(normalizeAdminItem).filter(Boolean) : fallback;
}

function normalizeAdminItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key, normalizeAdminField(key, value)])
  );
}

function normalizeAdminField(key, value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeAdminField(key, entry)).filter((entry) => entry !== "");
  }

  if (value && typeof value === "object") {
    return normalizeAdminItem(value);
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  const longMediaFields = new Set(["image", "gallery", "video", "photo", "thumbnail"]);

  if (longMediaFields.has(key) || trimmed.startsWith("data:image/") || trimmed.startsWith("data:video/")) {
    return trimmed.slice(0, 8 * 1024 * 1024);
  }

  return trimmed.slice(0, 600);
}

function syncInventoryWithProducts(catalog) {
  const products = Array.isArray(catalog.products) ? catalog.products : [];
  const existingInventory = Array.isArray(catalog.inventory) ? catalog.inventory : [];
  const inventoryByProductId = new Map(existingInventory.map((item) => [String(item.productId || ""), item]));
  const inventoryBySku = new Map(existingInventory.map((item) => [String(item.sku || ""), item]));
  const inventoryByName = new Map(existingInventory.map((item) => [String(item.product || "").toLowerCase(), item]));

  return {
    ...catalog,
    inventory: products.map((product) => {
      const productId = String(product.id || "");
      const sku = String(product.sku || "");
      const name = String(product.name || "New Product");
      const existing =
        inventoryByProductId.get(productId) ||
        inventoryBySku.get(sku) ||
        inventoryByName.get(name.toLowerCase()) ||
        {};
      const quantity = Number(product.quantity ?? existing.stock ?? 0);

      return {
        id: existing.id || `inv-${productId || crypto.randomUUID()}`,
        productId,
        sku: sku || existing.sku || "VOID-NEW",
        product: name,
        stock: Number.isFinite(quantity) ? quantity : 0,
        reorderAt: Number(existing.reorderAt ?? 5),
        location: existing.location || "Mumbai"
      };
    })
  };
}

async function getDatabase() {
  if (!process.env.MONGODB_URI) {
    return null;
  }

  if (mongoDb) {
    return mongoDb;
  }

  mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
  mongoDb = mongoClient.db(process.env.MONGODB_DB || "void_store");
  await ensureMongoSetup(mongoDb);
  return mongoDb;
}

async function ensureMongoSetup(db) {
  if (!mongoIndexesReady) {
    await db.collection("users").createIndex({ mobile: 1 }, { unique: true });
    await db.collection("users").createIndex({ id: 1 }, { unique: true });
    mongoIndexesReady = true;
  }

  if (!mongoSeedReady) {
    await migrateJsonUsersToMongo(db);
    mongoSeedReady = true;
  }
}

async function migrateJsonUsersToMongo(db) {
  const users = readUsersFromFile();

  if (!users.length) {
    return;
  }

  await db.collection("users").bulkWrite(
    users.map((user) => ({
      updateOne: {
        filter: { mobile: user.mobile },
        update: {
          $setOnInsert: {
            ...user,
            orders: Array.isArray(user.orders) ? user.orders : [],
            wishlist: Array.isArray(user.wishlist) ? user.wishlist : [],
            addresses: Array.isArray(user.addresses) ? user.addresses : [],
            rewardPoints: Number(user.rewardPoints || 0),
            notifications: Array.isArray(user.notifications) ? user.notifications : [],
            recentlyViewed: Array.isArray(user.recentlyViewed) ? user.recentlyViewed : [],
            returns: Array.isArray(user.returns) ? user.returns : [],
            coupons: Array.isArray(user.coupons) ? user.coupons : []
          }
        },
        upsert: true
      }
    })),
    { ordered: false }
  );
}

async function readAllUsers() {
  const db = await getDatabase();

  if (db) {
    const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
    return users.map(cleanMongoUser);
  }

  return readUsersFromFile();
}

async function findUserByMobile(mobile) {
  const db = await getDatabase();

  if (db) {
    return cleanMongoUser(await db.collection("users").findOne({ mobile }));
  }

  return readUsersFromFile().find((entry) => entry.mobile === mobile) || null;
}

async function findUserById(id) {
  const db = await getDatabase();

  if (db) {
    return cleanMongoUser(await db.collection("users").findOne({ id }));
  }

  return readUsersFromFile().find((entry) => entry.id === id) || null;
}

async function createUser(user) {
  const nextUser = withAccountDefaults(user);
  const db = await getDatabase();

  if (db) {
    await db.collection("users").insertOne(nextUser);
    return nextUser;
  }

  const users = readUsersFromFile();
  users.push(nextUser);
  writeUsersToFile(users);
  return nextUser;
}

async function addAddressToUser(userId, address) {
  const db = await getDatabase();

  if (db) {
    const result = await db.collection("users").findOneAndUpdate(
      { id: userId },
      { $push: { addresses: address } },
      { returnDocument: "after" }
    );
    return cleanMongoUser(result);
  }

  return updateFileUser(userId, (user) => ({
    ...user,
    addresses: Array.isArray(user.addresses) ? [...user.addresses, address] : [address]
  }));
}

async function addOrderToUser(userId, order) {
  const db = await getDatabase();

  if (db) {
    const result = await db.collection("users").findOneAndUpdate(
      { id: userId },
      {
        $push: {
          orders: {
            $each: [order],
            $position: 0
          }
        }
      },
      { returnDocument: "after" }
    );
    return cleanMongoUser(result);
  }

  return updateFileUser(userId, (user) => ({
    ...user,
    orders: Array.isArray(user.orders) ? [order, ...user.orders] : [order]
  }));
}

async function readAdminCatalog() {
  const db = await getDatabase();

  if (db) {
    const entry = await db.collection("adminCatalog").findOne({ key: "default" });

    if (entry?.catalog) {
      return normalizeAdminCatalog(entry.catalog);
    }

    const catalog = getDefaultAdminCatalog();
    await db.collection("adminCatalog").updateOne(
      { key: "default" },
      { $set: { catalog, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return catalog;
  }

  ensureDataStore();
  if (!fs.existsSync(adminFile)) {
    writeAdminCatalogToFile(getDefaultAdminCatalog());
  }

  return normalizeAdminCatalog(JSON.parse(fs.readFileSync(adminFile, "utf8")));
}

async function writeAdminCatalog(catalog) {
  const db = await getDatabase();

  if (db) {
    await db.collection("adminCatalog").updateOne(
      { key: "default" },
      { $set: { catalog, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return;
  }

  writeAdminCatalogToFile(catalog);
}

function writeAdminCatalogToFile(catalog) {
  ensureDataStore();
  fs.writeFileSync(adminFile, JSON.stringify(catalog, null, 2));
}

function updateFileUser(userId, updater) {
  const users = readUsersFromFile();
  const userIndex = users.findIndex((entry) => entry.id === userId);

  if (userIndex < 0) {
    return null;
  }

  users[userIndex] = updater(users[userIndex]);
  writeUsersToFile(users);
  return users[userIndex];
}

function readUsersFromFile() {
  ensureDataStore();
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

function writeUsersToFile(users) {
  ensureDataStore();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function ensureDataStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
  }
}

function ensureUploadsStore() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function getImageExtension(contentType) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
  };

  return extensions[contentType] || "";
}

function getDefaultAdminCatalog() {
  return {
    products: [],
    inventory: [],
    shipping: [
      { id: "ship-standard", zone: "India Standard", partner: "Manual Dispatch", fee: "Free", eta: "3-6 days", status: "Active" },
      { id: "ship-express", zone: "Metro Express", partner: "Manual Dispatch", fee: "Rs. 99", eta: "1-3 days", status: "Draft" }
    ],
    refunds: [
      { id: "refund-policy", type: "Return window", rule: "7 days from delivery", status: "Active" },
      { id: "refund-quality", type: "Quality issue", rule: "Photo/video proof required", status: "Active" }
    ],
    coupons: [
      { id: "coupon-welcome", code: "VOID10", discount: "10%", status: "Active", expires: "2026-12-31" },
      { id: "coupon-stack", code: "GYMREADY", discount: "Rs. 150", status: "Draft", expires: "2026-09-30" }
    ],
    categories: [],
    cms: [
      { id: "cms-home-hero", page: "Home", block: "Hero", title: "Activewear for your next rep", status: "Published" },
      { id: "cms-refund", page: "Refund Policy", block: "Policy copy", title: "Returns and refunds", status: "Published" }
    ],
    reviewVideos: [
      { id: "review-athlete", title: "VOID Athlete Review", product: "Performance T-Shirt", status: "Published" },
      { id: "review-fit", title: "Training Fit Check", product: "Shorts and daily gym wear", status: "Published" }
    ],
    updatedAt: new Date().toISOString()
  };
}

function getOrderStatus(order) {
  return String(order.status || order.orderStatus || "pending").toLowerCase();
}

function parseMoney(value) {
  const amount = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function cleanMongoUser(user) {
  if (!user) {
    return null;
  }

  const { _id, ...publicShape } = user;
  return publicShape;
}

function withAccountDefaults(user) {
  return {
    ...user,
    orders: Array.isArray(user.orders) ? user.orders : [],
    wishlist: Array.isArray(user.wishlist) ? user.wishlist : [],
    addresses: Array.isArray(user.addresses) ? user.addresses : [],
    rewardPoints: Number(user.rewardPoints || 0),
    notifications: Array.isArray(user.notifications) ? user.notifications : [],
    recentlyViewed: Array.isArray(user.recentlyViewed) ? user.recentlyViewed : [],
    returns: Array.isArray(user.returns) ? user.returns : [],
    coupons: Array.isArray(user.coupons) ? user.coupons : []
  };
}

function toPublicUser(user) {
  const safeUser = withAccountDefaults(user);

  return {
    id: safeUser.id,
    name: safeUser.name || "",
    mobile: safeUser.mobile,
    isAdmin: isAdminMobile(safeUser.mobile),
    createdAt: safeUser.createdAt,
    orders: safeUser.orders,
    wishlist: safeUser.wishlist,
    addresses: safeUser.addresses,
    rewardPoints: safeUser.rewardPoints,
    notifications: safeUser.notifications,
    recentlyViewed: safeUser.recentlyViewed,
    returns: safeUser.returns,
    coupons: safeUser.coupons
  };
}

function getOtpProvider() {
  return String(process.env.OTP_PROVIDER || "").trim().toLowerCase() === "messagecentral" ? "messagecentral" : "console";
}

function requiredEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is not configured.`);
  }

  return process.env[name];
}

function getProviderErrorMessage(error) {
  return error?.message || "OTP request failed.";
}

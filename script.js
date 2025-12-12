const storage = {
  get: (key) => JSON.parse(localStorage.getItem(key)) || [],
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key) => localStorage.removeItem(key),
  insert: (key, item) => {
    const existing = storage.get(key);
    existing.push(item);
    storage.set(key, existing);
  },
};

const $ = (id) => document.getElementById(id);
const currentPage = window.location.pathname.split("/").pop();

const loggedInUser = storage.get("logged-in");
const isLoggedIn = localStorage.getItem("logged-in") !== null;
const isAdmin = isLoggedIn && loggedInUser.role === "admin";

const publicPages = ["login.html", "register.html"];
const adminOnlyPages = ["admin.html", "users.html"];

if (isLoggedIn) {
  if (publicPages.includes(currentPage)) {
    window.location.href = isAdmin ? "admin.html" : "inventory.html";
  } else if (!isAdmin && adminOnlyPages.includes(currentPage)) {
    window.location.href = "inventory.html";
  }
} else if (!publicPages.includes(currentPage)) {
  window.location.href = "login.html";
}

const initTheme = () => {
  const theme = storage.get("theme") || "light";
  document.body.classList.toggle("dark", theme === "dark");
};

$("theme-toggle")?.addEventListener("click", () => {
  const newTheme = storage.get("theme") === "dark" ? "light" : "dark";
  storage.set("theme", newTheme);
  document.body.classList.toggle("dark");
});

initTheme();

const login = (username, password) => {
  const users = storage.get("users");
  const user = users.find((u) => u.username === username);

  if (!user) return { error: "Username not found" };
  if (user.password !== password) return { error: "Incorrect password" };

  storage.set("logged-in", user);
  return { user };
};

$("register-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = {
    username: $("username").value,
    full_name: $("full_name").value,
    tel: $("tel").value,
    password: $("password").value,
  };

  const { username, full_name, tel, password } = formData;

  if (
    username.length < 3 ||
    password.length < 4 ||
    full_name.length < 3 ||
    tel.length < 10
  ) {
    return alert("Please fill in all fields correctly.");
  }

  storage.insert("users", formData);
  alert("Account created successfully!");
  window.location.href = "login.html";
});

$("login-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const result = login($("username").value, $("password").value);

  if (result.error) return alert(result.error);

  alert(`Login successful! Welcome ${result.user.full_name}`);
  window.location.href =
    result.user.role === "admin" ? "admin.html" : "inventory.html";
});

$("logout-btn")?.addEventListener("click", () => {
  storage.remove("logged-in");
  window.location.href = "login.html";
});

const saveProducts = (products) => storage.set("products", products);

const deleteProduct = (index) => {
  const products = storage.get("products").filter((_, i) => i !== index);
  saveProducts(products);
  window.location.reload();
};

const editProduct = (index, updatedData) => {
  const products = storage.get("products");
  products[index] = updatedData;
  saveProducts(products);
};

const showDialog = (id) => $(id)?.classList.remove("hidden");
const hideDialog = (id) => $(id)?.classList.add("hidden");

$("open-create-product-dialog")?.addEventListener("click", () =>
  showDialog("create-product-dialog")
);
$("close-create-product-dialog")?.addEventListener("click", () =>
  hideDialog("create-product-dialog")
);
$("close-edit-dialog")?.addEventListener("click", () =>
  hideDialog("edit-dialog")
);

$("create-product-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("product-name").value;
  const price = parseFloat($("product-price").value);
  const quantity = parseInt($("product-quantity").value, 10);

  if (!name || isNaN(price) || price <= 0 || isNaN(quantity) || quantity < 0) {
    return alert("Please fill in all fields correctly.");
  }

  storage.insert("products", {
    name,
    status: "Available",
    price,
    quantity,
    createdBy: loggedInUser.username,
  });

  alert("Product created successfully!");
  window.location.reload();
});

const openEditDialog = (index) => {
  showDialog("edit-dialog");

  const products = storage.get("products");
  const product = products[index];

  $("edit-product-name").value = product.name;
  $("edit-product-price").value = product.price;
  $("edit-product-quantity").value = product.quantity;

  $("edit-product-form").onsubmit = (e) => {
    e.preventDefault();

    editProduct(index, {
      ...product,
      name: $("edit-product-name").value,
      price: parseFloat($("edit-product-price").value),
      quantity: parseInt($("edit-product-quantity").value, 10),
    });

    alert("Product updated successfully!");
    window.location.reload();
  };
};

const loadProducts = (searchQuery = "", statusFilter = "") => {
  const products = storage.get("products");
  const userProducts = isAdmin
    ? products
    : products.filter((p) => p.createdBy === loggedInUser.username);

  const filtered = userProducts.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tbody = $("products-tbody");
  if (!tbody) return;

  tbody.innerHTML = filtered
    .map(
      (product, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${product.name}</td>
      <td>${product.status}</td>
      <td>${product.price.toFixed(2)} rwf</td>
      <td>${product.quantity}</td>
      <td>
        <button class="btn btn-small" onclick="openEditDialog(${products.indexOf(
          product
        )})">Edit</button>
        <button class="btn btn-small" onclick="deleteProduct(${products.indexOf(
          product
        )})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
};

const applyFilters = () => {
  const searchQuery = $("search-input")?.value || "";
  const statusFilter = $("status-filter")?.value || "";
  loadProducts(searchQuery, statusFilter);
};

$("search-input")?.addEventListener("input", applyFilters);
$("status-filter")?.addEventListener("change", applyFilters);

const loadUsers = () => {
  const tbody = $("users-tbody");
  if (!tbody) return;

  tbody.innerHTML = storage
    .get("users")
    .map(
      (user, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${user.full_name}</td>
      <td>${user.username}</td>
      <td>${user.tel}</td>
    </tr>
  `
    )
    .join("");
};

if ($("products-tbody")) loadProducts();
if ($("users-tbody")) loadUsers();

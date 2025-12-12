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

const initAdmin = () => {
  const users = storage.get("users");
  const adminExists = users.some((u) => u.role === "admin");
  if (!adminExists) {
    storage.insert("users", {
      username: "admin",
      full_name: "Administrator",
      tel: "0000000000",
      password: "admin123",
      role: "admin",
    });
  }
};
initAdmin();

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

const toggleTheme = () => {
  const newTheme = storage.get("theme") === "dark" ? "light" : "dark";
  storage.set("theme", newTheme);
  document.body.classList.toggle("dark");
};

$("theme-toggle")?.addEventListener("click", toggleTheme);

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey && e.key === "d") || (e.altKey && e.key === "t")) {
    e.preventDefault();
    toggleTheme();
  }
});

initTheme();

const isLettersOnly = (str) => /^[a-zA-Z\s]+$/.test(str);

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
    username: $("username").value.trim(),
    full_name: $("full_name").value.trim(),
    tel: $("tel").value.trim(),
    password: $("password").value,
  };

  const { username, full_name, tel, password } = formData;

  if (!isLettersOnly(full_name)) {
    return alert("Full name must contain only letters.");
  }
  if (username.length < 3) {
    return alert("Username must be at least 3 characters.");
  }
  if (password.length < 4) {
    return alert("Password must be at least 4 characters.");
  }
  if (tel.length < 10) {
    return alert("Phone number must be at least 10 digits.");
  }

  const users = storage.get("users");
  if (users.some((u) => u.username === username)) {
    return alert("Username already exists. Please choose another.");
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
  alert("Logged out successfully!");
  window.location.href = "login.html";
});

const saveProducts = (products) => storage.set("products", products);

const deleteProduct = (index) => {
  if (!confirm("Are you sure you want to delete this product?")) return;
  const products = storage.get("products").filter((_, i) => i !== index);
  saveProducts(products);
  alert("Product deleted successfully!");
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

  const name = $("product-name").value.trim();
  const price = parseFloat($("product-price").value);
  const quantity = parseInt($("product-quantity").value, 10);
  const status = $("product-status")?.value || "Available";

  if (!name || !isLettersOnly(name)) {
    return alert("Product name must contain only letters and cannot be empty.");
  }
  if (isNaN(price) || price <= 0) {
    return alert("Price must be a positive number.");
  }
  if (isNaN(quantity) || quantity < 0) {
    return alert("Quantity must be a positive number.");
  }

  storage.insert("products", {
    name,
    status,
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
  if ($("edit-product-status")) {
    $("edit-product-status").value = product.status;
  }

  $("edit-product-form").onsubmit = (e) => {
    e.preventDefault();

    const name = $("edit-product-name").value.trim();
    const price = parseFloat($("edit-product-price").value);
    const quantity = parseInt($("edit-product-quantity").value, 10);
    const status = $("edit-product-status")?.value || product.status;

    if (!name || !isLettersOnly(name)) {
      return alert("Product name must contain only letters.");
    }
    if (isNaN(price) || price <= 0) {
      return alert("Price must be a positive number.");
    }
    if (isNaN(quantity) || quantity < 0) {
      return alert("Quantity must be a positive number.");
    }

    editProduct(index, { ...product, name, price, quantity, status });
    alert("Product updated successfully!");
    window.location.reload();
  };
};

const loadProducts = (searchQuery = "", statusFilter = "", userFilter = "") => {
  const products = storage.get("products");
  const userProducts = isAdmin
    ? products
    : products.filter((p) => p.createdBy === loggedInUser.username);

  const filtered = userProducts.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || product.status === statusFilter;
    const matchesUser = !userFilter || product.createdBy === userFilter;
    return matchesSearch && matchesStatus && matchesUser;
  });

  const tbody = $("products-tbody");
  if (!tbody) return;

  const showOwner = isAdmin && currentPage === "admin.html";

  tbody.innerHTML = filtered
    .map((product, i) => {
      const realIndex = products.indexOf(product);
      return `
    <tr>
      <td>${i + 1}</td>
      <td>${product.name}</td>
      ${showOwner ? `<td>${product.createdBy}</td>` : ""}
      <td>${product.status}</td>
      <td>${product.price.toFixed(2)} rwf</td>
      <td>${product.quantity}</td>
      <td>
        <button class="btn btn-small" data-action="edit" data-index="${realIndex}">Edit</button>
        <button class="btn btn-small" data-action="delete" data-index="${realIndex}">Delete</button>
      </td>
    </tr>
  `;
    })
    .join("");
};

$("products-tbody")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const index = parseInt(btn.dataset.index, 10);

  if (action === "edit") {
    openEditDialog(index);
  } else if (action === "delete") {
    deleteProduct(index);
  }
});

const applyFilters = () => {
  const searchQuery = $("search-input")?.value || "";
  const statusFilter = $("status-filter")?.value || "";
  const userFilter = $("user-filter")?.value || "";
  loadProducts(searchQuery, statusFilter, userFilter);
};

$("search-input")?.addEventListener("input", applyFilters);
$("status-filter")?.addEventListener("change", applyFilters);
$("user-filter")?.addEventListener("change", applyFilters);

const populateUserFilter = () => {
  const select = $("user-filter");
  if (!select) return;

  const users = storage.get("users").filter((u) => u.role !== "admin");
  select.innerHTML =
    '<option value="">All Users</option>' +
    users
      .map((u) => `<option value="${u.username}">${u.full_name}</option>`)
      .join("");
};

let editingUserIndex = null;

const loadUsers = () => {
  const tbody = $("users-tbody");
  if (!tbody) return;

  const allUsers = storage.get("users");
  const users = allUsers.filter((u) => u.role !== "admin");

  tbody.innerHTML = users
    .map((user, i) => {
      const realIndex = allUsers.findIndex((u) => u.username === user.username);
      return `
    <tr>
      <td>${i + 1}</td>
      <td>${user.full_name}</td>
      <td>${user.username}</td>
      <td>${user.tel}</td>
      <td>
        <button class="btn btn-small" data-action="edit-user" data-index="${realIndex}">Edit</button>
        <button class="btn btn-small" data-action="delete-user" data-index="${realIndex}">Delete</button>
      </td>
    </tr>
  `;
    })
    .join("");
};

$("users-tbody")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const index = parseInt(btn.dataset.index, 10);

  if (action === "edit-user") {
    openEditUserDialog(index);
  } else if (action === "delete-user") {
    deleteUser(index);
  }
});

$("open-create-user-dialog")?.addEventListener("click", () =>
  showDialog("create-user-dialog")
);
$("close-create-user-dialog")?.addEventListener("click", () =>
  hideDialog("create-user-dialog")
);

$("admin-create-user-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = $("new-username").value.trim();
  const full_name = $("new-full-name").value.trim();
  const tel = $("new-tel").value.trim();
  const password = $("new-password").value;

  if (!isLettersOnly(full_name)) {
    return alert("Full name must contain only letters.");
  }
  if (username.length < 3) {
    return alert("Username must be at least 3 characters.");
  }
  if (password.length < 4) {
    return alert("Password must be at least 4 characters.");
  }
  if (tel.length < 10) {
    return alert("Phone number must be at least 10 digits.");
  }

  const users = storage.get("users");
  if (users.some((u) => u.username === username)) {
    return alert("Username already exists.");
  }

  storage.insert("users", { username, full_name, tel, password });
  alert("User created successfully!");
  window.location.reload();
});

$("close-edit-user-dialog")?.addEventListener("click", () =>
  hideDialog("edit-user-dialog")
);

const openEditUserDialog = (index) => {
  showDialog("edit-user-dialog");
  editingUserIndex = index;
  console.log({ editingUserIndex });

  const users = storage.get("users");
  const user = users[index];

  $("edit-username").value = user.username;
  $("edit-full-name").value = user.full_name;
  $("edit-tel").value = user.tel;
  $("edit-password").value = "";
};

$("edit-user-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const users = storage.get("users");
  const user = users[editingUserIndex];
  console.log(user);
  const oldUsername = user.username;

  const username = $("edit-username").value.trim();
  const full_name = $("edit-full-name").value.trim();
  const tel = $("edit-tel").value.trim();
  const password = $("edit-password").value || user.password;

  if (!isLettersOnly(full_name)) {
    return alert("Full name must contain only letters.");
  }
  if (username.length < 3) {
    return alert("Username must be at least 3 characters.");
  }

  if (username !== oldUsername && users.some((u) => u.username === username)) {
    return alert("Username already exists.");
  }

  users[editingUserIndex] = { ...user, username, full_name, tel, password };
  storage.set("users", users);

  if (username !== oldUsername) {
    const products = storage
      .get("products")
      .map((p) =>
        p.createdBy === oldUsername ? { ...p, createdBy: username } : p
      );
    storage.set("products", products);
  }

  alert("User updated successfully!");
  window.location.reload();
});

const deleteUser = (index) => {
  if (!confirm("Are you sure? This will also delete all their products."))
    return;

  const users = storage.get("users");
  const user = users[index];

  const products = storage
    .get("products")
    .filter((p) => p.createdBy !== user.username);
  storage.set("products", products);
  users.splice(index, 1);
  storage.set("users", users);

  alert("User and their products deleted successfully!");
  window.location.reload();
};

if ($("products-tbody")) {
  populateUserFilter();
  loadProducts();
}
if ($("users-tbody")) {
  loadUsers();
}

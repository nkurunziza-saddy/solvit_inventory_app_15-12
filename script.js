function insert(item, key) {
  let existing = JSON.parse(localStorage.getItem(key)) || [];
  existing.push(item);
  localStorage.setItem(key, JSON.stringify(existing));
}

function replace(item, key) {
  localStorage.removeItem(key);
  localStorage.setItem(key, JSON.stringify(item));
}

function get(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

const isLoggedin = localStorage.getItem("logged-in") !== null;
const isAdmin = isLoggedin ? get("logged-in").role === "admin" : false;
const currentPath = window.location.pathname.split("/").pop();
console.log(currentPath);
if (
  isLoggedin &&
  isAdmin &&
  (currentPath === "login.html" || currentPath === "register.html")
) {
  if (currentPath === "login.html" || currentPath === "register.html") {
    window.location.href = "admin.html";
  }
  if (currentPath === "inventory.html") {
    window.location.href = "admin.html";
  }
} else if (isLoggedin && !isAdmin) {
  if (currentPath === "login.html" || currentPath === "register.html") {
    window.location.href = "inventory.html";
  }
  if (currentPath === "users.html") {
    window.location.href = "inventory.html";
  }
  if (currentPath === "admin.html") {
    window.location.href = "inventory.html";
  }
} else if (
  !isLoggedin &&
  (currentPath !== "login.html" || currentPath !== "register.html")
) {
  window.location.href = "login.html";
}

function login(username, password) {
  const users = get("users");

  const foundUser = users.find((u) => u.username === username);
  if (!foundUser) {
    return "wrong username";
  }

  loggedInUser = foundUser.password === password ? foundUser : undefined;

  if (loggedInUser === undefined) {
    return "wrong password";
  }

  replace(loggedInUser, "logged-in");

  return loggedInUser;
}

function registerForm() {
  document
    .getElementById("register-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const full_name = document.getElementById("full_name").value;
      const tel = document.getElementById("tel").value;
      const password = document.getElementById("password").value;
      const formData = {
        username,
        full_name,
        tel,
        password,
      };
      console.log(formData);
      if (
        typeof username !== "string" ||
        username.length < 3 ||
        typeof password !== "string" ||
        password.length < 4 ||
        typeof full_name !== "string" ||
        full_name.length < 3 ||
        typeof tel !== "string" ||
        tel.length < 10
      ) {
        alert("Please fill in all fields correctly.");
      }
      insert(formData, "users");
      alert("Account created successfully!");
      window.location.href = "login.html";
    });
}

function loginForm() {
  document
    .getElementById("login-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      console.log(username, password);
      const result = login(username, password);

      if (result === "wrong username") {
        alert("Username not found. Please try again.");
        return;
      } else if (result === "wrong password") {
        alert("Incorrect password. Please try again.");
        return;
      }

      alert("Login successful! Welcome " + result.full_name);
      window.location.href = "inventory.html";
    });
}

document
  .getElementById("create-product-form")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("product-name").value;
    const price = parseFloat(document.getElementById("product-price").value);
    const quantity = parseInt(
      document.getElementById("product-quantity").value,
      10
    );
    const user = get("logged-in");
    if (
      typeof name !== "string" ||
      name.length < 1 ||
      isNaN(price) ||
      price <= 0 ||
      isNaN(quantity) ||
      quantity < 0
    ) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const newProduct = {
      name,
      status: "Available",
      price,
      quantity,
      createdBy: user.username,
    };

    insert(newProduct, "products");
    alert("Product created successfully!");
    user.role === "admin"
      ? (window.location.href = "admin.html")
      : (window.location.href = "inventory.html");

    //   hh
    const dialog = document.getElementById("create-product-dialog");
    dialog.classList.add("hidden");
    window.location.reload();

    const closeBtn = document.getElementById("close-create-product-dialog");
    closeBtn.onclick = function () {
      dialog.classList.add("hidden");
    };
  });

function deleteProduct(index) {
  let products = get("products");
  products = products.filter((product, i) => i !== index);
  replace(products, "products");
  window.location.reload();
}

function openEditDialog(index) {
  const dialog = document.getElementById("edit-dialog");
  dialog.classList.remove("hidden");

  const productNameInput = document.getElementById("edit-product-name");
  const productPriceInput = document.getElementById("edit-product-price");
  const productQuantityInput = document.getElementById("edit-product-quantity");

  const products = get("products");
  const product = products[index];

  productNameInput.value = product.name;
  productPriceInput.value = product.price;
  productQuantityInput.value = product.quantity;

  const editForm = document.getElementById("edit-product-form");
  editForm.onsubmit = function (e) {
    e.preventDefault();
    const updatedName = productNameInput.value;
    const updatedPrice = parseFloat(productPriceInput.value);
    const updatedQuantity = parseInt(productQuantityInput.value, 10);

    const updatedData = {
      ...product,
      name: updatedName,
      price: updatedPrice,
      quantity: updatedQuantity,
    };

    editProduct(index, updatedData);
    alert("Product updated successfully!");
    dialog.classList.add("hidden");
    window.location.reload();
  };

  const closeBtn = document.getElementById("close-edit-dialog");
  closeBtn.onclick = function () {
    dialog.classList.add("hidden");
  };
}

document
  .getElementById("close-edit-dialog")
  ?.addEventListener("click", function () {
    const dialog = document.getElementById("edit-dialog");
    dialog.classList.add("hidden");
  });

document
  .getElementById("close-create-product-dialog")
  ?.addEventListener("click", function () {
    const dialog = document.getElementById("create-product-dialog");
    dialog.classList.add("hidden");
  });
document
  .getElementById("close-create-product-dialog")
  ?.addEventListener("click", function () {
    const dialog = document.getElementById("create-product-dialog");
    dialog.classList.add("hidden");
  });
document
  .getElementById("open-create-product-dialog")
  ?.addEventListener("click", function () {
    const dialog = document.getElementById("create-product-dialog");
    dialog.classList.remove("hidden");
  });

function loadProducts() {
  const products = get("products");
  const loggedInUser = get("logged-in");
  const isAdmin = loggedInUser.role === "admin";
  const userProducts = isAdmin
    ? products
    : products.filter((product) => product.createdBy === loggedInUser.username);
  const productsTableBody = document.getElementById("products-tbody");
  userProducts.forEach((product, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td id="product-name-${index}">${product.name}</td>
      <td>${product.status}</td>
      <td>$${product.price.toFixed(2)}</td>
      <td>${product.quantity}</td>
   
      <td>
        <button type="button" id="edit-btn-${index}" onclick="openEditDialog(${index})">Edit</button>
        <button type="submit" id="delete-btn-${index}" onclick="deleteProduct(${index})">Delete</button>
      </td>

    `;

    productsTableBody.appendChild(row);
  });
}

function loadUsers() {
  const users = get("users");
  const usersTableBody = document.getElementById("users-tbody");
  users.forEach((user, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.full_name}</td>
      <td>${user.username}</td>
      <td>${user.tel}</td>
    `;

    usersTableBody.appendChild(row);
  });
}

document.getElementById("logout-btn")?.addEventListener("click", function () {
  localStorage.removeItem("logged-in");
  window.location.href = "login.html";
});

function editProduct(index, updatedData) {
  let products = get("products");
  products = products.filter((product, i) => i != index);
  products.push(updatedData);
  replace(products, "products");
}

document.getElementById("theme-toggle").addEventListener("click", function () {
  const theme = get("theme") || "light";
  replace(theme === "light" ? "dark" : "light", "theme");
  document.body.classList.toggle("dark");
});

const theme = get("theme") || "light";
if (theme === "dark") {
  document.body.classList.add("dark");
} else {
  document.body.classList.remove("dark");
}

const isRegisterPage = document.getElementById("register-form") !== null;
const isLoginPage = document.getElementById("login-form") !== null;
const isInventoryPage = document.getElementById("products-tbody") !== null;
const isUsersPage = document.getElementById("users-tbody") !== null;

if (isInventoryPage) {
  loadProducts();
} else if (isUsersPage) {
  loadUsers();
} else if (isRegisterPage) {
  registerForm();
} else if (isLoginPage) {
  loginForm();
}

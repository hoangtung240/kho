function getElement(id) {
    return document.getElementById(id);
}

function getUsers() {
    let users = [];

    try {
        users = JSON.parse(localStorage.getItem("users") || "[]");
    } catch (error) {
        users = [];
    }

    if (!Array.isArray(users)) users = [];

    if (users.length === 0) {
        try {
            const oldUser = JSON.parse(localStorage.getItem("user") || "null");
            if (oldUser && oldUser.email) {
                users = [oldUser];
                localStorage.setItem("users", JSON.stringify(users));
            }
        } catch (error) {}
    }

    users = users.map(function (user) {
        return {
            name: user.name || user.email.split("@")[0],
            email: user.email,
            password: user.password || "",
            avatar: user.avatar || "",
            wallpaper: user.wallpaper || "",
            lastUsedAt: user.lastUsedAt || 0,
            role: user.role || "user"
        };
    });

    return users.filter(function (user) { return user.email; });
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
    const email = localStorage.getItem("currentUser");
    if (!email) return null;
    return getUsers().find(function (user) 
        { return user.email === email; 
    }) || null;
}
function getLastUser() {
    const email = localStorage.getItem("lastUser");
    if (!email) return null;

    return getUsers().find(function (user) {
        return user.email === email;
    }) || null;
}

function isLoggedIn() {
    return localStorage.getItem("loggedIn") === "true" && !!getCurrentUser();
}

function getInitial(user) {
    if (!user) return "?";
    const text = (user.name || user.email || "?").trim();
    return text.charAt(0).toUpperCase();
}

function avatarHTML(user, className) {
    if (user && user.avatar) {
        return '<img src="' + user.avatar + '" alt="Avatar">';
    }
    return '<span>' + escapeHTML(getInitial(user)) + '</span>';
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setCurrentUser(user) {
    localStorage.setItem("currentUser", user.email);
    localStorage.setItem("lastUser", user.email);
    localStorage.setItem("loggedIn", "true");

    user.lastUsedAt = Date.now();

    const users = getUsers().map(function (item) {
        return item.email === user.email ? user : item;
    });

    saveUsers(users);
}

function logoutToWelcome() {
    const currentUser = getCurrentUser();

    if (currentUser) {
        localStorage.setItem("lastUser", currentUser.email);
    }

    localStorage.removeItem("loggedIn");
    localStorage.removeItem("currentUser");

    window.location.href = "welcome.html";
}

function confirmLogoutToWelcome() {
    const user = getCurrentUser();
    const name = user ? user.name : "tài khoản này";

    const ok = window.confirm(
        "Bạn có muốn đăng xuất tài khoản " + name + " không?\n\n" +
        "Tài khoản vẫn được lưu ở trang bắt đầu để bạn có thể sử dụng lại."
    );

    if (ok) logoutToWelcome();
}


/* =========================================================
   XÓA TÀI KHOẢN
   ========================================================= */

function deleteCurrentAccount() {
    const user = getCurrentUser();

    // Kiểm tra có tài khoản đang đăng nhập hay không
    if (!user) {
        alert("Hiện tại chưa có tài khoản nào đang đăng nhập.");
        return;
    }

    // Xác nhận trước khi xóa
    const ok = window.confirm(
        "Bạn có chắc chắn muốn xóa tài khoản này không?\n\n" +
        "Tài khoản: " + user.name + "\n" +
        "Email: " + user.email + "\n\n" +
        "Tài khoản sẽ bị xóa khỏi website và không thể sử dụng lại."
    );

    // Nếu chọn Hủy
    if (!ok) {
        return;
    }

    // Lấy danh sách tài khoản
    let users = getUsers();

    // Xóa tài khoản đang đăng nhập
    users = users.filter(function (item) {
        return item.email !== user.email;
    });

    // Lưu lại danh sách tài khoản
    saveUsers(users);

    // Xóa trạng thái đăng nhập
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("currentUser");

    // Xóa tài khoản được nhớ gần nhất
    if (localStorage.getItem("lastUser") === user.email) {
        localStorage.removeItem("lastUser");
    }

    alert("Đã xóa tài khoản thành công.");

    // Quay về trang bắt đầu
    window.location.href = "welcome.html";
}


/* =========================================================
   ĐĂNG KÝ
   ========================================================= */

const registerForm = getElement("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = getElement("registerName").value.trim();
        const email = getElement("registerEmail").value.trim().toLowerCase();
        const password = getElement("registerPassword").value;
        const confirmPassword = getElement("registerConfirm").value;

        if (!name || !email || !password || !confirmPassword) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp.");
            return;
        }

        let users = getUsers();

        const existed = users.some(function (user) {
            return user.email === email;
        });

        if (existed) {
            alert("Email này đã được đăng ký.");
            return;
        }

        const newUser = {
            name: name,
            email: email,
            password: password,
            avatar: "",
            wallpaper: "",
            lastUsedAt: Date.now()
        };

        users.push(newUser);

        saveUsers(users);

        // Không tự động đăng nhập sau khi đăng ký
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("currentUser");

        alert("Đăng ký tài khoản thành công.");

        window.location.href = "login.html";
    });
}


/* =========================================================
   ĐĂNG NHẬP
   ========================================================= */

const loginForm = getElement("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = getElement("loginEmail").value.trim().toLowerCase();
        const password = getElement("loginPassword").value;

        const users = getUsers();

        const user = users.find(function (item) {
            return item.email === email &&
                   item.password === password;
        });

        if (!user) {
            alert("Email hoặc mật khẩu không đúng.");
            return;
        }

        setCurrentUser(user);

        alert("Đăng nhập thành công.");

        window.location.href = "index.html";
    });
}


/* =========================================================
   ĐI VỀ TRANG CHỦ KHI ĐÃ CÓ TÀI KHOẢN
   ========================================================= */

function goHomeWithAccountCheck(event) {
    if (event) {
        event.preventDefault();
    }

    const users = getUsers();

    if (users.length === 0) {
        alert("Hiện chưa có tài khoản. Vui lòng đăng ký trước.");
        window.location.href = "register.html";
        return;
    }

    showAccountSelector(users, "index.html");
}


/* =========================================================
   CHỌN TÀI KHOẢN
   ========================================================= */

function showAccountSelector(users, target) {
    closeAccountOverlay();

    const overlay = document.createElement("div");
    overlay.className = "account-overlay";

    const box = document.createElement("div");
    box.className = "account-selector";

    const title = document.createElement("h3");
    title.textContent = "Chọn tài khoản";

    const description = document.createElement("p");
    description.textContent = "Chọn tài khoản bạn muốn sử dụng.";

    const accountList = document.createElement("div");
    accountList.className = "account-selector-list";

    let selectedUser = users[0] || null;

    users.forEach(function (user) {
        const item = document.createElement("button");

        item.type = "button";
        item.className = "account-selector-item";

        if (selectedUser && selectedUser.email === user.email) {
            item.classList.add("selected");
        }

        item.innerHTML =
            avatarHTML(user, "") +
            '<span class="account-selector-info">' +
            '<strong>' + escapeHTML(user.name) + '</strong>' +
            '<small>' + escapeHTML(user.email) + '</small>' +
            '</span>';

        item.addEventListener("click", function () {
            selectedUser = user;

            accountList
                .querySelectorAll(".account-selector-item")
                .forEach(function (button) {
                    button.classList.remove("selected");
                });

            item.classList.add("selected");
        });

        accountList.appendChild(item);
    });

    const passwordInput = document.createElement("input");

    passwordInput.type = "password";
    passwordInput.placeholder = "Nhập mật khẩu tài khoản";
    passwordInput.className = "account-selector-password";

    const confirmButton = document.createElement("button");

    confirmButton.type = "button";
    confirmButton.className = "account-selector-confirm";
    confirmButton.textContent = "Tiếp tục";

    const cancelButton = document.createElement("button");

    cancelButton.type = "button";
    cancelButton.className = "account-selector-cancel";
    cancelButton.textContent = "Hủy";

    cancelButton.addEventListener("click", function () {
        overlay.remove();
    });

    confirmButton.addEventListener("click", function () {

        if (!selectedUser) {
            alert("Vui lòng chọn tài khoản.");
            return;
        }

        const latestUsers = getUsers();

        const latestUser = latestUsers.find(function (user) {
            return user.email === selectedUser.email;
        });

        if (!latestUser) {
            alert("Không tìm thấy tài khoản.");
            return;
        }

        if (passwordInput.value !== latestUser.password) {
            alert("Mật khẩu không đúng.");
            passwordInput.focus();
            return;
        }

        setCurrentUser(latestUser);

        overlay.remove();

        window.location.href = target || "index.html";
    });

    box.appendChild(title);
    box.appendChild(description);
    box.appendChild(accountList);
    box.appendChild(passwordInput);
    box.appendChild(confirmButton);
    box.appendChild(cancelButton);

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    passwordInput.focus();
}


/* =========================================================
   ĐÓNG BẢNG CHỌN TÀI KHOẢN
   ========================================================= */

function closeAccountOverlay() {
    document.querySelectorAll(".account-overlay").forEach(function (el) {
        el.remove();
    });
}

function initAccountWidget() {
    const loggedIn = isLoggedIn();
    const user = loggedIn ? getCurrentUser() : null;

    document.querySelectorAll(".account-widget").forEach(function (el) {
        el.remove();
    });

    const widget = document.createElement("div");
    widget.className = "account-widget";

    if (loggedIn && user) {

        widget.innerHTML =
            '<button type="button" class="account-avatar-btn" aria-label="Tài khoản">' +
                avatarHTML(user, "") +
            '</button>' +

            '<div class="account-menu">' +

                '<div class="account-menu-head">' +

                    '<div class="account-menu-avatar">' +
                        avatarHTML(user, "") +
                    '</div>' +

                    '<div>' +

                        '<div class="account-menu-name">' +
                            escapeHTML(user.name) +
                        '</div>' +

                        '<div class="account-menu-email">' +
                            escapeHTML(user.email) +
                        '</div>' +

                    '</div>' +

                '</div>' +


                '<button type="button" class="account-menu-item" data-action="avatar">' +
                    '🖼️ <span>Đổi hình đại diện</span>' +
                '</button>' +


                '<button type="button" class="account-menu-item" data-action="wallpaper">' +
                    '🎨 <span>Đổi hình nền</span>' +
                '</button>' +


                '<button type="button" class="account-menu-item" data-action="switch">' +
                    '👤 <span>Đổi tài khoản</span>' +
                '</button>' +


                '<div class="account-menu-divider"></div>' +


                '<button type="button" class="account-menu-item" data-action="start">' +
                    '🏠 <span>Về trang bắt đầu</span>' +
                '</button>' +

                (user.role === "admin"
                    ? '<button type="button" class="account-menu-item" data-action="admin">' +
                        '🛠️ <span>Quản trị</span>' +
                    '</button>'
                    : '') +

                '<button type="button" class="account-menu-item danger" data-action="logout">' +
                    '🚪 <span>Đăng xuất tài khoản</span>' +
                '</button>' +


                '<button type="button" class="account-menu-item danger" data-action="delete-account">' +
                    '🗑️ <span>Xóa tài khoản</span>' +
                '</button>' +

            '</div>';

    } else {

        widget.innerHTML =
            '<button type="button" class="account-avatar-btn" aria-label="Tài khoản khách">' +
                '<div class="account-avatar-fallback">G</div>' +
            '</button>' +

            '<div class="account-menu">' +

                '<div class="account-menu-head">' +

                    '<div class="account-menu-avatar">' +
                        '<div class="account-avatar-fallback">G</div>' +
                    '</div>' +

                    '<div>' +

                        '<div class="account-menu-name">' +
                            'Tài khoản khách' +
                        '</div>' +

                        '<div class="account-menu-email">' +
                            'Chưa đăng nhập' +
                        '</div>' +

                    '</div>' +

                '</div>' +


                '<button type="button" class="account-menu-item" data-action="login">' +
                    '🔑 <span>Đăng nhập</span>' +
                '</button>' +


                '<button type="button" class="account-menu-item" data-action="register">' +
                    '📝 <span>Đăng ký tài khoản</span>' +
                '</button>' +


                '<button type="button" class="account-menu-item" data-action="switch">' +
                    '👤 <span>Chọn tài khoản</span>' +
                '</button>' +


                '<div class="account-menu-divider"></div>' +


                '<button type="button" class="account-menu-item" data-action="start">' +
                    '🏠 <span>Về trang bắt đầu</span>' +
                '</button>' +

            '</div>';
    }

    const avatarButton = widget.querySelector(".account-avatar-btn");
    const menu = widget.querySelector(".account-menu");

    avatarButton.addEventListener("click", function (event) {
        event.stopPropagation();

        menu.classList.toggle("show");
    });

    if (loggedIn && user) {

        const avatarButtonMenu =
            widget.querySelector('[data-action="avatar"]');

        if (avatarButtonMenu) {
            avatarButtonMenu.addEventListener("click", function () {

                menu.classList.remove("show");

                changeAvatar();
            });
        }

        const wallpaperButton =
            widget.querySelector('[data-action="wallpaper"]');

        if (wallpaperButton) {
            wallpaperButton.addEventListener("click", function () {

                menu.classList.remove("show");

                changeWallpaper();
            });
        }
    }

    const switchButton =
        widget.querySelector('[data-action="switch"]');

    if (switchButton) {

        switchButton.addEventListener("click", function () {

            menu.classList.remove("show");

            const users = getUsers();

            if (users.length === 0) {

                alert(
                    "Hiện chưa có tài khoản nào. " +
                    "Bạn hãy đăng ký tài khoản trước."
                );

                window.location.href = "register.html";

                return;
            }

            showAccountSelector(
                users,
                location.pathname.split("/").pop() || "index.html"
            );
        });
    }

    const loginButton =
        widget.querySelector('[data-action="login"]');

    if (loginButton) {

        loginButton.addEventListener("click", function () {

            menu.classList.remove("show");

            window.location.href = "login.html";
        });
    }

    const registerButton =
        widget.querySelector('[data-action="register"]');

    if (registerButton) {

        registerButton.addEventListener("click", function () {

            menu.classList.remove("show");

            window.location.href = "register.html";
        });
    }

    const startButton =
        widget.querySelector('[data-action="start"]');

    if (startButton) {

        startButton.addEventListener("click", function () {

            menu.classList.remove("show");

            window.location.href = "welcome.html";
        });
    }
    const adminButton =
        widget.querySelector('[data-action="admin"]');

    if (adminButton) {
        adminButton.addEventListener("click", function () {
            menu.classList.remove("show");
            openAdminPage();
        });
    }

    const logoutButton =
        widget.querySelector('[data-action="logout"]');

    if (logoutButton) {

        logoutButton.addEventListener("click", function () {

            menu.classList.remove("show");

            confirmLogoutToWelcome();
        });
    }

    const deleteAccountButton =
        widget.querySelector('[data-action="delete-account"]');

    if (deleteAccountButton) {

        deleteAccountButton.addEventListener("click", function () {

            menu.classList.remove("show");

            deleteCurrentAccount();
        });
    }

    document.addEventListener("click", function (event) {

        if (!widget.contains(event.target)) {

            menu.classList.remove("show");
        }
    });

    document.body.appendChild(widget);

    if (document.querySelector(".navbar .container")) {

        const navbarContainer =
            document.querySelector(".navbar .container");

        navbarContainer.appendChild(widget);
    }
}

function changeAvatar() {
    const user = getCurrentUser();
    if (!user) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";

    input.addEventListener("change", function () {
        const file = input.files && input.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Ảnh đại diện tối đa 2MB nhé.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            const users = getUsers();
            const index = users.findIndex(function (u) { return u.email === user.email; });
            if (index === -1) return;
            users[index].avatar = reader.result;
            saveUsers(users);
            initAccountWidget();
            if (document.body.dataset.page === "welcome") renderWelcomeAccounts();
        };
        reader.readAsDataURL(file);
    });

    input.click();
}

function changeWallpaper() {
    const user = getCurrentUser();
    if (!user) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";

    input.addEventListener("change", function () {
        const file = input.files && input.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Hình nền tối đa 5MB nhé.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            const users = getUsers();
            const index = users.findIndex(function (u) { return u.email === user.email; });
            if (index === -1) return;
            users[index].wallpaper = reader.result;
            saveUsers(users);
            applyWallpaper();
        };
        reader.readAsDataURL(file);
    });

    input.click();
}

function applyWallpaper() {
    const user = getCurrentUser();
    if (!user || !user.wallpaper) return;

    document.body.style.backgroundImage =
        "linear-gradient(rgba(248,250,252,.78), rgba(248,250,252,.78)), url(\"" + user.wallpaper + "\")";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundPosition = "center";
}

function initWelcomePage() {
    if (document.body.dataset.page !== "welcome") return;

    const users = getUsers();
    const current = getCurrentUser();

    const box = document.querySelector(".welcome-box");

    if (!box) return;

    const old = document.querySelector(".welcome-accounts");

    if (old) {
        old.remove();
    }

    const oldButtons = box.querySelector(".welcome-buttons");

    if (oldButtons) {
        oldButtons.style.display = "flex";
    }

    const accounts = document.createElement("div");

    accounts.className = "welcome-accounts";

    const currentLabel = document.createElement("p");

    currentLabel.className = "welcome-current-label";

    currentLabel.textContent = "Tài khoản đang sử dụng";

    accounts.appendChild(currentLabel);

    if (!current) {

        const guestCard = document.createElement("div");

        guestCard.className = "welcome-account-card";

        guestCard.style.cursor = "default";

        guestCard.innerHTML =
            '<span class="welcome-account-avatar">👤</span>' +
            '<span>' +
            '<span class="welcome-account-name">Tài khoản khách</span>' +
            '<span class="welcome-account-email">Chưa đăng nhập</span>' +
            '</span>';

        accounts.appendChild(guestCard);

    } else {

        accounts.appendChild(
            createWelcomeAccountCard(current, true)
        );
    }

    let others = users;

    if (current) {

        others = users.filter(function (user) {
            return user.email !== current.email;
        });
    }


    if (others.length > 0) {

        const otherWrap = document.createElement("div");

        otherWrap.className = "welcome-other";


        const otherLabel = document.createElement("p");

        otherLabel.className = "welcome-other-label";

        otherLabel.textContent = "Tài khoản khác";

        otherWrap.appendChild(otherLabel);


        others.forEach(function (user) {

            otherWrap.appendChild(
                createWelcomeAccountCard(user, false)
            );

        });


        accounts.appendChild(otherWrap);
    }

    box.appendChild(accounts);
}

function createWelcomeAccountCard(user, isCurrent) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "welcome-account-card";
    card.innerHTML =
        '<span class="welcome-account-avatar">' + avatarHTML(user, "") + '</span>' +
        '<span>' +
        '<span class="welcome-account-name">' + escapeHTML(user.name) + (isCurrent ? " ✓" : "") + '</span>' +
        '<span class="welcome-account-email">' + escapeHTML(user.email) + '</span>' +
        '</span>';

    card.addEventListener("click", function () {
        showAccountSelector([user], "index.html");
    });

    return card;
}

function protectContentNavigation() {

    if (
        location.pathname.endsWith("index.html") ||
        location.pathname.endsWith("/")
    ) {

        const nav = document.querySelector(".navbar-nav");

        if (
            nav &&
            isLoggedIn() &&
            !nav.querySelector("[data-start-link]")
        ) {

            const li = document.createElement("li");

            li.className = "nav-item";

            li.innerHTML =
                '<a class="nav-link" href="welcome.html" data-start-link>' +
                'Trang bắt đầu' +
                '</a>';

            nav.appendChild(li);
        }
    }
}

function resetTestAccount() {
    localStorage.removeItem("user");
    localStorage.removeItem("users");
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("lastUser");

    alert("Đã xóa toàn bộ tài khoản test.");
    window.location.href = "welcome.html";
}

function togglePassword(inputId, button) {
    const input = getElement(inputId);
    if (!input) return;

    if (input.type === "password") {
        input.type = "text";
        button.textContent = "Ẩn";
    } else {
        input.type = "password";
        button.textContent = "Hiện";
    }
}

function getPosts() {
    let posts = [];

    try {
        posts = JSON.parse(localStorage.getItem("posts") || "[]");
    } catch (error) {
        posts = [];
    }

    if (!Array.isArray(posts)) {
        posts = [];
    }

    return posts;
}

function savePosts(posts) {
    localStorage.setItem("posts", JSON.stringify(posts));
}

function isAdmin() {
    const user = getCurrentUser();

    return !!(
        user &&
        user.role === "admin"
    );
}

function openAdminPage() {
    if (!isLoggedIn()) {
        alert("Bạn cần đăng nhập để sử dụng chức năng này.");
        window.location.href = "login.html";
        return;
    }

    if (!isAdmin()) {
        alert("Bạn không có quyền truy cập trang quản trị.");
        return;
    }

    window.location.href = "admin.html";
}

function approvePost(postId) {
    if (!isAdmin()) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }

    const posts = getPosts();

    const post = posts.find(function (item) {
        return item.id === postId;
    });

    if (!post) {
        alert("Không tìm thấy bài viết.");
        return;
    }

    post.status = "published";
    post.approvedAt = Date.now();
    post.approvedBy = "admin";

    savePosts(posts);

    alert("Đã duyệt bài viết.");

    renderAdminPosts();
}

function rejectPost(postId) {

    if (!isAdmin()) {

        alert("Bạn không có quyền thực hiện thao tác này.");

        return;
    }


    const posts = getPosts();


    const post = posts.find(function (item) {

        return item.id === postId;

    });


    if (!post) {

        alert("Không tìm thấy bài viết.");

        return;
    }

    const reason = window.prompt(
        "Nhập lý do từ chối bài viết:\n\n" +
        "Ví dụ:\n" +
        "- Tiêu đề không phù hợp\n" +
        "- Nội dung quá ngắn\n" +
        "- Nội dung không liên quan đến tiêu đề\n" +
        "- Nội dung không phù hợp"
    );

    if (reason === null) {

        return;
    }

    const rejectReason = reason.trim();

    if (rejectReason === "") {

        alert("Bạn phải nhập lý do từ chối.");

        return;
    }

    if (rejectReason.length < 10) {

        alert(
            "Lý do từ chối quá ngắn.\n\n" +
            "Lý do phải có ít nhất 10 ký tự."
        );

        return;
    }

    post.status = "rejected";

    post.rejectedAt = Date.now();

    post.rejectedBy = "admin";

    post.rejectReason = rejectReason;

    savePosts(posts);


    alert(
        "Đã từ chối bài viết.\n\n" +
        "Lý do: " +
        rejectReason
    );

    renderAdminPosts();
}

function deletePostByAdmin(postId) {
    if (!isAdmin()) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }

    const posts = getPosts();

    const post = posts.find(function (item) {
        return item.id === postId;
    });

    if (!post) {
        alert("Không tìm thấy bài viết.");
        return;
    }

    const ok = window.confirm(
        "Bạn có chắc muốn xóa bài viết này không?\n\n" +
        post.title
    );

    if (!ok) {
        return;
    }

    const newPosts = posts.filter(function (item) {
        return item.id !== postId;
    });

    savePosts(newPosts);

    alert("Đã xóa bài viết.");

    renderAdminPosts();
}

function renderAdminPosts() {
    const container = document.getElementById("adminPosts");

    if (!container) {
        return;
    }

    if (!isAdmin()) {
        container.innerHTML = `
            <div class="alert alert-danger">
                Bạn không có quyền truy cập khu vực này.
            </div>
        `;
        return;
    }

    const posts = getPosts();

    const pendingPosts = posts.filter(function (post) {
        return post.status === "pending";
    });

    if (pendingPosts.length === 0) {
        container.innerHTML = `
            <div class="admin-empty">
                <h4>Không có bài viết chờ duyệt</h4>
                <p>Hiện tại chưa có bài viết nào cần Admin kiểm tra.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    pendingPosts.forEach(function (post) {

        const card = document.createElement("div");

        card.className = "admin-post-card";

        card.innerHTML = `
            <div class="admin-post-image">
                ${
                    post.image
                    ? `<img src="${escapeHTML(post.image)}" alt="Ảnh bài viết">`
                    : `<div class="admin-no-image">Không có ảnh</div>`
                }
            </div>

            <div class="admin-post-content">

                <span class="admin-post-status">
                    CHỜ DUYỆT
                </span>

                <h3>
                    ${escapeHTML(post.title)}
                </h3>

                <p class="admin-post-category">
                    Danh mục: ${escapeHTML(post.category || "Chưa chọn")}
                </p>

                <p class="admin-post-author">
                    Người gửi:
                    ${post.anonymous
                        ? "Ẩn danh"
                        : escapeHTML(post.authorName || "Không rõ")}
                </p>

                <p class="admin-post-time">
                    Thời gian:
                    ${post.createdAt
                        ? new Date(post.createdAt).toLocaleString("vi-VN")
                        : "Không rõ"}
                </p>

                <div class="admin-post-text">
                    ${escapeHTML(post.content)}
                </div>

                <div class="admin-post-actions">

                    <button
                        class="btn btn-success"
                        onclick="approvePost('${post.id}')"
                    >
                        ✓ Đồng ý đăng
                    </button>

                    <button
                        class="btn btn-warning"
                        onclick="rejectPost('${post.id}')"
                    >
                        ✕ Từ chối
                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="deletePostByAdmin('${post.id}')"
                    >
                        🗑 Xóa
                    </button>

                </div>

            </div>
        `;

        container.appendChild(card);
    });
}

function initSubmitPost() {

    const form = document.getElementById("submitPostForm");

    if (!form) {
        return;
    }


    const titleInput =
        document.getElementById("postTitle");

    const categoryInput =
        document.getElementById("postCategory");

    const imageInput =
        document.getElementById("postImage");

    const contentInput =
        document.getElementById("postContent");

    const anonymousInput =
        document.getElementById("postAnonymous");

    const message =
        document.getElementById("submitMessage");

    const titleWordCount =
        document.getElementById("titleWordCount");

    const contentWordCount =
        document.getElementById("contentWordCount");

    const submitAuthor =
        document.getElementById("submitAuthor");


    const user = getCurrentUser();


    if (submitAuthor) {

        if (user) {

            submitAuthor.textContent =
                anonymousInput && anonymousInput.checked
                    ? "Ẩn danh"
                    : user.name;

        } else {

            submitAuthor.textContent =
                "Khách";

        }

    }


    function updateTitleCount() {

        if (!titleWordCount) {
            return;
        }

        const count =
            countWords(titleInput.value);

        titleWordCount.textContent =
            count + " từ";
    }


    function updateContentCount() {

        if (!contentWordCount) {
            return;
        }

        const count =
            countWords(contentInput.value);

        contentWordCount.textContent =
            count + " từ";
    }


    titleInput.addEventListener(
        "input",
        updateTitleCount
    );


    contentInput.addEventListener(
        "input",
        updateContentCount
    );


    if (anonymousInput) {

        anonymousInput.addEventListener(
            "change",
            function () {

                if (!submitAuthor) {
                    return;
                }

                if (anonymousInput.checked) {

                    submitAuthor.textContent =
                        "Ẩn danh";

                } else if (user) {

                    submitAuthor.textContent =
                        user.name;

                } else {

                    submitAuthor.textContent =
                        "Khách";

                }

            }
        );

    }


    updateTitleCount();
    updateContentCount();


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const title =
                titleInput.value.trim();

            const category =
                categoryInput.value.trim();

            const image =
                imageInput.value.trim();

            const content =
                contentInput.value.trim();

            const anonymous =
                anonymousInput
                    ? anonymousInput.checked
                    : false;


            const titleWords =
                countWords(title);

            const contentWords =
                countWords(content);


            /*
             * KIỂM TRA TIÊU ĐỀ
             */

            if (!title) {

                alert(
                    "Vui lòng nhập tiêu đề bài viết."
                );

                titleInput.focus();

                return;
            }


            if (titleWords < 5) {

                alert(
                    "Tiêu đề phải có ít nhất 5 từ.\n\n" +
                    "Hiện tại: " +
                    titleWords +
                    " từ."
                );

                titleInput.focus();

                return;
            }


            if (titleWords > 30) {

                alert(
                    "Tiêu đề không được quá 30 từ."
                );

                titleInput.focus();

                return;
            }


            /*
             * KIỂM TRA DANH MỤC
             */

            if (!category) {

                alert(
                    "Vui lòng chọn danh mục."
                );

                categoryInput.focus();

                return;
            }


            /*
             * KIỂM TRA NỘI DUNG
             */

            if (!content) {

                alert(
                    "Vui lòng nhập nội dung bài viết."
                );

                contentInput.focus();

                return;
            }


            if (contentWords < 50) {

                alert(
                    "Nội dung bài viết phải có ít nhất 50 từ.\n\n" +
                    "Hiện tại: " +
                    contentWords +
                    " từ."
                );

                contentInput.focus();

                return;
            }


            /*
             * KIỂM TRA ĐỘ DÀI KÝ TỰ
             */

            if (content.length > 10000) {

                alert(
                    "Nội dung không được vượt quá 10.000 ký tự."
                );

                contentInput.focus();

                return;
            }


            /*
             * LẤY DANH SÁCH BÀI
             */

            const posts =
                getPosts();


            /*
             * KIỂM TRA TÀI KHOẢN
             */

            const currentUser =
                getCurrentUser();


            if (!currentUser) {

                alert(
                    "Bạn cần đăng nhập trước khi gửi bài."
                );

                window.location.href =
                    "login.html";

                return;
            }


            /*
             * KIỂM TRA ADMIN
             */

            const isAdminUser =
                currentUser.role === "admin";


            /*
             * TẠO BÀI VIẾT
             */

            const post = {

                id:
                    Date.now().toString(),

                title:
                    title,

                category:
                    category,

                image:
                    image,

                content:
                    content,

                authorName:
                    currentUser.name,

                authorEmail:
                    currentUser.email,

                anonymous:
                    anonymous,

                createdAt:
                    Date.now(),

                status:
                    isAdminUser
                        ? "published"
                        : "pending"

            };


            /*
             * LƯU BÀI
             */

            posts.push(post);

            savePosts(posts);


            /*
             * THÔNG BÁO
             */

            if (isAdminUser) {

                alert(
                    "Đăng bài thành công.\n\n" +
                    "Bài viết của Admin đã được đăng ngay."
                );

            } else {

                alert(
                    "Gửi bài thành công.\n\n" +
                    "Bài viết đang chờ Admin kiểm tra và duyệt."
                );

            }


            /*
             * RESET FORM
             */

            form.reset();


            updateTitleCount();
            updateContentCount();


            if (submitAuthor) {

                submitAuthor.textContent =
                    currentUser.name;

            }

        }
    );

}
function renderSubmittedPosts() {

    const rows = document.querySelectorAll(".row.g-4[data-category]");

    if (!rows.length) {
        return;
    }

    const posts = getPosts().filter(function (post) {
        return post.status === "published";
    });

    rows.forEach(function (row) {

        const category = row.dataset.category;

        if (!category) {
            return;
        }

        const categoryPosts = posts.filter(function (post) {
            return post.category === category;
        });

        categoryPosts.forEach(function (post) {

            const col = document.createElement("div");
            col.className = "col-md-6 col-lg-4";

            const card = document.createElement("article");
            card.className = "card h-100 shadow-sm submitted-post-card";

            const imageHTML = post.image
                ? '<img src="' + escapeHTML(post.image) +
                  '" class="card-img-top" alt="Ảnh bài viết">'
                : '<div class="submitted-post-no-image">Không có ảnh</div>';

            const author = post.anonymous
                ? "Ẩn danh"
                : escapeHTML(post.authorName || "Không rõ");

            const date = post.createdAt
                ? new Date(post.createdAt).toLocaleDateString("vi-VN")
                : "Không rõ";

            const excerpt = getPostExcerpt(post.content, 45);

            card.innerHTML =
                imageHTML +
                '<div class="card-body d-flex flex-column">' +
                    '<span class="badge bg-secondary align-self-start mb-2">' +
                        escapeHTML(post.category) +
                    '</span>' +
                    '<h3 class="card-title">' +
                        escapeHTML(post.title) +
                    '</h3>' +
                    '<p class="card-text">' +
                        escapeHTML(excerpt) +
                    '</p>' +
                    '<div class="small text-muted mb-3">' +
                        '👤 ' + author + ' · 🕒 ' + date +
                    '</div>' +
                    '<a href="detail.html?id=' +
                        encodeURIComponent(post.id) +
                        '" class="btn btn-primary mt-auto">' +
                        'Xem chi tiết' +
                    '</a>' +
                '</div>';

            col.appendChild(card);
            row.appendChild(col);
        });
    });
}

function initAdminPage() {
    if (!document.getElementById("adminPosts")) {
        return;
    }

    if (!isLoggedIn()) {
        alert("Bạn cần đăng nhập để vào trang Admin.");
        window.location.href = "login.html";
        return;
    }

    if (!isAdmin()) {
        alert("Tài khoản của bạn không có quyền Admin.");
        window.location.href = "index.html";
        return;
    }

    renderAdminPosts();
}
document.addEventListener("DOMContentLoaded", function () {

    initWelcomePage();

    initAccountWidget();

    applyWallpaper();

    protectContentNavigation();

    initAdminPage();

    initSubmitPost();

    renderSubmittedPosts();

    renderDynamicDetailPost();

});


window.addEventListener("pageshow", function () {

    initWelcomePage();

    initAccountWidget();

    applyWallpaper();

});
function countWords(text) {
    if (!text) {
        return 0;
    }

    const words = text
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return words.length;
}
function getPostExcerpt(text, wordLimit = 45) {
    if (!text) {
        return "";
    }

    const words = text
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length <= wordLimit) {
        return words.join(" ");
    }

    return words
        .slice(0, wordLimit)
        .join(" ") + "...";
}
function renderDynamicDetailPost() {

    const container =
        document.getElementById("dynamicDetail");

    if (!container) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const postId =
        params.get("id");


    if (!postId) {

        container.innerHTML = `
            <div class="detail-error">
                <h2>Không tìm thấy bài viết</h2>
                <p>
                    Đường dẫn bài viết không hợp lệ.
                </p>

                <a
                    href="index.html"
                    class="btn btn-primary"
                >
                    Về trang chủ
                </a>
            </div>
        `;

        return;
    }


    const posts =
        getPosts();


    const post =
        posts.find(function (item) {

            return String(item.id) ===
                String(postId);

        });


    if (!post) {

        container.innerHTML = `
            <div class="detail-error">
                <h2>Không tìm thấy bài viết</h2>
                <p>
                    Bài viết này không tồn tại hoặc đã bị xóa.
                </p>

                <a
                    href="index.html"
                    class="btn btn-primary"
                >
                    Về trang chủ
                </a>
            </div>
        `;

        return;
    }

    if (post.status !== "published") {

        container.innerHTML = `
            <div class="detail-error">
                <h2>Bài viết chưa được đăng</h2>
                <p>
                    Bài viết này hiện chưa được Admin duyệt.
                </p>

                <a
                    href="index.html"
                    class="btn btn-primary"
                >
                    Về trang chủ
                </a>
            </div>
        `;

        return;
    }


    const author =
        post.anonymous
            ? "Ẩn danh"
            : escapeHTML(
                post.authorName ||
                "Không rõ"
            );


    const date =
        post.createdAt
            ? new Date(
                post.createdAt
            ).toLocaleString("vi-VN")
            : "Không rõ";


    const category =
        escapeHTML(
            post.category ||
            "Chưa chọn"
        );


    const title =
        escapeHTML(
            post.title
        );


    const content =
        escapeHTML(
            post.content
        );


    let imageHTML = "";


    if (post.image) {

        imageHTML = `
            <img
                src="${escapeHTML(post.image)}"
                alt="Ảnh bài viết"
                class="detail-img"
            >
        `;

    } else {

        imageHTML = `
            <div class="detail-no-image">
                Không có ảnh bài viết
            </div>
        `;

    }


    container.innerHTML = `

        <span class="detail-category">
            ${category}
        </span>


        <h1 class="detail-title">
            ${title}
        </h1>


        <div class="detail-meta">

            <span>
                👤 Người đăng:
                ${author}
            </span>

            <span>
                🕒 ${date}
            </span>

        </div>


        ${imageHTML}


        <div class="detail-content">
            ${content}
        </div>


        <div class="detail-back">

            <a
                href="${getCategoryPage(post.category)}"
                class="btn btn-outline-primary"
            >
                ← Về danh mục
            </a>

        </div>

    `;

}
function getCategoryPage(category) {

    const categoryPages = {

        "Thời sự":
            "thoisu.html",

        "Thế giới":
            "thegioi.html",

        "Thể thao":
            "thethao.html",

        "Giải trí":
            "giaitri.html",

        "Công nghệ":
            "congnghe.html",

        "Đời sống":
            "doisong.html"

    };


    return (
        categoryPages[category] ||
        "index.html"
    );

}
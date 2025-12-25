/**
 * ClickApply Main Logic
 * Handles authentication, state management, and page-specific interactions.
 * Uses localStorage to simulate a backend database.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================================
    // 1. STATE MANAGEMENT & AUTH SERVICE (Simulated Backend)
    // =========================================================================
    
    const DB_KEY_USERS = 'clickApply_users';
    const DB_KEY_SESSION = 'clickApply_session';

    const AuthService = {
        /**
         * Retrieve all users from localStorage
         */
        getUsers: () => {
            const users = localStorage.getItem(DB_KEY_USERS);
            return users ? JSON.parse(users) : [];
        },

        /**
         * Register a new user
         */
        register: (fullName, email, password) => {
            const users = AuthService.getUsers();
            
            // Check if email exists
            if (users.find(u => u.email === email)) {
                return { success: false, message: 'Email already registered.' };
            }

            const newUser = {
                id: Date.now().toString(),
                fullName,
                email,
                password,
                profileCompleted: false, // Flag to track flow
                jobType: '',
                bio: '',
                usage: { daily: 0, weekly: 0, monthly: 0 }, // Simulating usage stats
                applications: []
            };

            users.push(newUser);
            localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
            return { success: true, user: newUser };
        },

        /**
         * Login user
         */
        login: (email, password) => {
            const users = AuthService.getUsers();
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem(DB_KEY_SESSION, JSON.stringify(user));
                return { success: true, user };
            }
            return { success: false, message: 'Invalid email or password.' };
        },

        /**
         * Get current logged-in user
         */
        getCurrentUser: () => {
            const session = localStorage.getItem(DB_KEY_SESSION);
            return session ? JSON.parse(session) : null;
        },

        /**
         * Update current user profile data
         */
        updateProfile: (data) => {
            let currentUser = AuthService.getCurrentUser();
            if (!currentUser) return false;

            // Update session
            currentUser = { ...currentUser, ...data };
            localStorage.setItem(DB_KEY_SESSION, JSON.stringify(currentUser));

            // Update "Database"
            const users = AuthService.getUsers();
            const index = users.findIndex(u => u.id === currentUser.id);
            if (index !== -1) {
                users[index] = currentUser;
                localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
            }
            return true;
        },

        /**
         * Logout
         */
        logout: () => {
            localStorage.removeItem(DB_KEY_SESSION);
            window.location.href = 'login.html';
        },

        /**
         * Require Auth (Redirect if not logged in)
         */
        requireAuth: () => {
            if (!AuthService.getCurrentUser()) {
                window.location.href = 'login.html';
            }
        }
    };

    // =========================================================================
    // 2. PAGE DETECTION
    // =========================================================================
    
    // We detect pages based on unique elements since body IDs weren't present in source
    const pages = {
        signup: document.querySelector('h2.auth-title')?.innerText.includes('Create your account'),
        login: document.querySelector('h2.auth-title')?.innerText.includes('Welcome back'),
        profile: document.querySelector('.profile-form'),
        dashboard: document.querySelector('.welcome-section'),
        landing: document.querySelector('.hero')
    };

    // =========================================================================
    // 3. GLOBAL EVENT DELEGATION
    // =========================================================================
    
    document.body.addEventListener('click', (e) => {
        // Handle Sidebar Logout
        if (e.target.closest('.sidebar-logout')) {
            e.preventDefault();
            AuthService.logout();
        }

        // Handle generic 'Save & Continue' on Profile page (if it was a button)
        // Note: Specific handling is done in initialization logic below
    });

    // =========================================================================
    // 4. PAGE SPECIFIC LOGIC
    // =========================================================================

    /**
     * Logic for Sign Up Page
     */
    if (pages.signup) {
        const form = document.querySelector('.auth-form');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPass = document.getElementById('confirm-password').value;

            if (password !== confirmPass) {
                alert('Passwords do not match!');
                return;
            }

            const result = AuthService.register(fullName, email, password);

            if (result.success) {
                // Auto login after signup
                AuthService.login(email, password);
                // Redirect new users to profile setup
                window.location.href = 'profile.html';
            } else {
                alert(result.message);
            }
        });
    }

    /**
     * Logic for Login Page
     */
    if (pages.login) {
        const form = document.querySelector('.auth-form');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const result = AuthService.login(email, password);

            if (result.success) {
                const user = result.user;
                // Redirect logic based on flow
                if (!user.profileCompleted) {
                    window.location.href = 'profile.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                alert(result.message);
            }
        });
    }

    /**
     * Logic for Profile/Resume Setup Page
     */
    if (pages.profile) {
        AuthService.requireAuth();
        const user = AuthService.getCurrentUser();

        // 1. Pre-fill form with known data
        if (user) {
            if (document.getElementById('full_name')) document.getElementById('full_name').value = user.fullName || '';
            if (document.getElementById('email')) document.getElementById('email').value = user.email || '';
            if (document.getElementById('job_type')) document.getElementById('job_type').value = user.jobType || '';
            if (document.getElementById('about')) document.getElementById('about').value = user.bio || '';
        }

        // 2. Handle File Upload UI (Make it look interactive)
        const fileInput = document.getElementById('resume');
        const fileLabel = document.querySelector('.file-text');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    fileLabel.textContent = `Selected: ${e.target.files[0].name}`;
                    // Simulate upload success visual
                    document.querySelector('.file-label').style.borderColor = '#2563eb';
                    document.querySelector('.file-label').style.backgroundColor = '#eff6ff';
                }
            });
        }

        // 3. Handle Saving
        const handleSave = (destination) => {
            const fullName = document.getElementById('full_name').value;
            const jobType = document.getElementById('job_type').value;
            const bio = document.getElementById('about').value;

            if (!fullName) {
                alert("Full Name is required.");
                return;
            }

            // Update User State
            AuthService.updateProfile({
                fullName,
                jobType,
                bio,
                profileCompleted: true // Mark flow as complete
            });

            // Redirect
            window.location.href = destination;
        };

        // Attach listeners to the "buttons" (which are <a> tags in HTML)
        const btns = document.querySelectorAll('.form-actions .btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Determine destination based on button class/text or href
                if (btn.classList.contains('btn-primary')) {
                    // "Save & Start Application"
                    handleSave('new_application.html'); // Assuming this page exists or redirect to dashboard
                } else {
                    // "Save & Continue"
                    handleSave('dashboard.html');
                }
            });
        });
    }

    /**
     * Logic for Dashboard
     */
    if (pages.dashboard) {
        AuthService.requireAuth();
        const user = AuthService.getCurrentUser();

        if (user) {
            // 1. Personalize Welcome Message
            const welcomeTitle = document.querySelector('.welcome-title');
            if (welcomeTitle) {
                // Get first name
                const firstName = user.fullName.split(' ')[0];
                welcomeTitle.textContent = `Welcome back, ${firstName}`;
            }

            // 2. Personalize Avatar
            const avatar = document.querySelector('.user-avatar');
            if (avatar) {
                const initials = user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                avatar.textContent = initials;
            }

            // 3. Update Usage Bars (Visual Simulation)
            // If user has specific usage stats, apply them. Otherwise default CSS handles it.
            if (user.usage) {
                // Example: Dynamic update of daily limit
                const dailyBar = document.querySelector('.usage-card:nth-child(1) .usage-progress-bar');
                const dailyText = document.querySelector('.usage-card:nth-child(1) .usage-text');
                
                if (dailyBar && dailyText && user.usage.daily > 0) {
                    const percent = (user.usage.daily / 5) * 100;
                    dailyBar.style.width = `${percent}%`;
                    dailyText.textContent = `${user.usage.daily} of 5 applications used`;
                }
            }
        }
    }

    /**
     * Logic for Landing Page
     */
    if (pages.landing) {
        // Smooth scroll implementation for navigation links is handled by CSS (scroll-behavior: smooth)
        // But we can check if user is already logged in for the CTA buttons
        
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            const loginBtn = document.querySelector('.nav-link-secondary');
            const ctaBtns = document.querySelectorAll('.btn-primary, .nav-link-cta');
            
            // Change "Sign Up" to "Go to Dashboard"
            if (ctaBtns) {
                ctaBtns.forEach(btn => {
                    btn.textContent = 'Go to Dashboard';
                    btn.href = 'dashboard.html';
                });
            }
            
            // Hide Login button or change to "Profile"
            if (loginBtn) {
                loginBtn.textContent = 'My Profile';
                loginBtn.href = 'profile.html';
            }
        }
    }

    // =========================================================================
    // 5. RESPONSIVE SIDEBAR HELPERS
    // =========================================================================
    
    // Close sidebar when clicking the overlay (Mobile)
    // The CSS handles the display, but we want to ensure the checkbox unchecks
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    if (sidebarOverlay && sidebarToggle) {
        sidebarOverlay.addEventListener('click', () => {
            sidebarToggle.checked = false;
        });
    }
});
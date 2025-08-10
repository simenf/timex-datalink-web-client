// Google Calendar OAuth 2.0 Authentication Module
export class GoogleCalendarAuth {
    constructor() {
        this.clientId = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.isAuthenticated = false;
        
        // OAuth 2.0 configuration
        this.authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        this.tokenUrl = 'https://oauth2.googleapis.com/token';
        this.scope = 'https://www.googleapis.com/auth/calendar.readonly';
        this.redirectUri = window.location.origin + window.location.pathname;
        
        // Load stored tokens on initialization
        this.loadStoredTokens();
    }
    
    // Initialize with Google Client ID (must be called before authentication)
    initialize(clientId) {
        this.clientId = clientId;
    }
    
    // Start OAuth 2.0 flow using PKCE (Proof Key for Code Exchange)
    async authenticate() {
        if (!this.clientId) {
            throw new Error('Google Client ID not configured. Please set up OAuth credentials.');
        }
        
        try {
            // Generate PKCE parameters
            const codeVerifier = this.generateCodeVerifier();
            const codeChallenge = await this.generateCodeChallenge(codeVerifier);
            
            // Store code verifier for later use
            sessionStorage.setItem('google_code_verifier', codeVerifier);
            
            // Build authorization URL
            const authParams = new URLSearchParams({
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                response_type: 'code',
                scope: this.scope,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                access_type: 'offline',
                prompt: 'consent'
            });
            
            const authUrl = `${this.authUrl}?${authParams.toString()}`;
            
            // Open authorization window
            const authWindow = window.open(
                authUrl,
                'google_auth',
                'width=500,height=600,scrollbars=yes,resizable=yes'
            );
            
            // Wait for authorization code
            const authCode = await this.waitForAuthCode(authWindow);
            
            // Exchange authorization code for tokens
            await this.exchangeCodeForTokens(authCode, codeVerifier);
            
            return true;
        } catch (error) {
            console.error('Authentication error:', error);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }
    
    // Check if user is currently authenticated
    isUserAuthenticated() {
        return this.isAuthenticated && this.accessToken && !this.isTokenExpired();
    }
    
    // Get current access token, refreshing if necessary
    async getAccessToken() {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Please authenticate first.');
        }
        
        if (this.isTokenExpired()) {
            await this.refreshAccessToken();
        }
        
        return this.accessToken;
    }
    
    // Refresh access token using refresh token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available. Please re-authenticate.');
        }
        
        try {
            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.status}`);
            }
            
            const tokenData = await response.json();
            
            // Update tokens
            this.accessToken = tokenData.access_token;
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
            
            // Update refresh token if provided
            if (tokenData.refresh_token) {
                this.refreshToken = tokenData.refresh_token;
            }
            
            // Store updated tokens
            this.storeTokens();
            
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearTokens();
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }
    
    // Sign out and clear stored tokens
    signOut() {
        this.clearTokens();
        this.isAuthenticated = false;
    }
    
    // Generate PKCE code verifier
    generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    
    // Generate PKCE code challenge
    async generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    
    // Wait for authorization code from popup window
    waitForAuthCode(authWindow) {
        return new Promise((resolve, reject) => {
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkClosed);
                    reject(new Error('Authentication cancelled by user'));
                }
            }, 1000);
            
            // Listen for message from popup
            const messageHandler = (event) => {
                if (event.origin !== window.location.origin) return;
                
                if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    authWindow.close();
                    resolve(event.data.code);
                } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    authWindow.close();
                    reject(new Error(event.data.error));
                }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Check for auth code in URL (fallback)
            const checkUrl = setInterval(() => {
                try {
                    const url = new URL(authWindow.location.href);
                    const code = url.searchParams.get('code');
                    const error = url.searchParams.get('error');
                    
                    if (code) {
                        clearInterval(checkClosed);
                        clearInterval(checkUrl);
                        window.removeEventListener('message', messageHandler);
                        authWindow.close();
                        resolve(code);
                    } else if (error) {
                        clearInterval(checkClosed);
                        clearInterval(checkUrl);
                        window.removeEventListener('message', messageHandler);
                        authWindow.close();
                        reject(new Error(`Authentication error: ${error}`));
                    }
                } catch (e) {
                    // Cross-origin error, continue checking
                }
            }, 1000);
        });
    }
    
    // Exchange authorization code for access and refresh tokens
    async exchangeCodeForTokens(authCode, codeVerifier) {
        try {
            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    code: authCode,
                    code_verifier: codeVerifier,
                    grant_type: 'authorization_code',
                    redirect_uri: this.redirectUri
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Token exchange failed: ${errorData.error_description || response.status}`);
            }
            
            const tokenData = await response.json();
            
            // Store tokens
            this.accessToken = tokenData.access_token;
            this.refreshToken = tokenData.refresh_token;
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
            this.isAuthenticated = true;
            
            // Persist tokens
            this.storeTokens();
            
            // Clean up session storage
            sessionStorage.removeItem('google_code_verifier');
            
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }
    
    // Check if current token is expired
    isTokenExpired() {
        if (!this.tokenExpiry) return true;
        return Date.now() >= (this.tokenExpiry - 60000); // 1 minute buffer
    }
    
    // Store tokens in localStorage
    storeTokens() {
        const tokenData = {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            tokenExpiry: this.tokenExpiry,
            isAuthenticated: this.isAuthenticated
        };
        
        localStorage.setItem('google_calendar_tokens', JSON.stringify(tokenData));
    }
    
    // Load stored tokens from localStorage
    loadStoredTokens() {
        try {
            const stored = localStorage.getItem('google_calendar_tokens');
            if (stored) {
                const tokenData = JSON.parse(stored);
                this.accessToken = tokenData.accessToken;
                this.refreshToken = tokenData.refreshToken;
                this.tokenExpiry = tokenData.tokenExpiry;
                this.isAuthenticated = tokenData.isAuthenticated && !this.isTokenExpired();
            }
        } catch (error) {
            console.error('Error loading stored tokens:', error);
            this.clearTokens();
        }
    }
    
    // Clear all stored tokens
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.isAuthenticated = false;
        localStorage.removeItem('google_calendar_tokens');
    }
    
    // Get user profile information
    async getUserProfile() {
        const token = await this.getAccessToken();
        
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get user profile: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }
}
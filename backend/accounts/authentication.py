from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.exceptions import AuthenticationFailed

class CookieJWTAuthentication(JWTAuthentication):
    PUBLIC_AUTH_PATHS = {
        '/auth/register/',
        '/auth/login/',
        '/auth/refreshToken/',
        '/auth/forgot-password/',
        '/auth/reset-password/',
    }

    def authenticate(self, request):
        # First try Authorization header
        # This is for api testing
        auth = self.get_header(request)

        if auth is None:
            if request.path in self.PUBLIC_AUTH_PATHS:
                return None

            # Try cookie
            # In this Project React request includes tokens in the COOKIES
            raw_token = request.COOKIES.get('access_token')
            if raw_token is None:
                return None
        else:
            raw_token = self.get_raw_token(auth)

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError, AuthenticationFailed):
            raise AuthenticationFailed('Invalid or expired token')

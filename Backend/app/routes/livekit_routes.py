"""
app/routes/livekit_routes.py — LiveKit Voice Support Token Generation
"""
from __future__ import annotations

import time
import uuid
import base64
import hashlib
import hmac
import json
try:
    import jwt
except ImportError:
    jwt = None

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _std_jwt_encode(payload: dict, secret: str) -> str:
    header = {'alg': 'HS256', 'typ': 'JWT'}
    h_b64 = _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    p_b64 = _b64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    sig_input = f'{h_b64}.{p_b64}'.encode('utf-8')
    sig = hmac.new(secret.encode('utf-8'), sig_input, hashlib.sha256).digest()
    return f'{h_b64}.{p_b64}.{_b64url_encode(sig)}'

from flask import Blueprint, request, g, current_app
from app.utils.response import success_response, error_response
from app.config import Config

livekit_bp = Blueprint('livekit', __name__)


def generate_livekit_token(identity: str, room_name: str, name: str = None) -> str:
    """Generate a valid LiveKit WebRTC Access Token signed with API secret."""
    api_key = Config.LIVEKIT_API_KEY
    api_secret = Config.LIVEKIT_API_SECRET
    now = int(time.time())

    # LiveKit video & voice grants
    payload = {
        'iss': api_key,
        'sub': identity,
        'name': name or identity,
        'nbf': now - 5,
        'exp': now + (6 * 3600),  # Valid for 6 hours
        'video': {
            'room': room_name,
            'roomJoin': True,
            'canPublish': True,
            'canSubscribe': True,
            'canPublishData': True,
        },
        'metadata': f'{{"user_type": "customer_support", "voice_id": "aura-2-cora-en", "voice_name": "Cora", "provider": "deepgram", "timestamp": {now}}}'
    }

    if jwt and hasattr(jwt, 'encode'):
        try:
            token = jwt.encode(payload, api_secret, algorithm='HS256')
            return token if isinstance(token, str) else token.decode('utf-8')
        except Exception:
            pass
    return _std_jwt_encode(payload, api_secret)


@livekit_bp.route('/token', methods=['GET', 'POST'])
def get_livekit_token():
    """
    Issue a LiveKit connection token for the Customer Support Voice Agent.
    Accessible by authenticated customers or visitors.
    Uses Deepgram Aura Cora voice profile ('aura-2-cora-en').
    """
    body = request.get_json(silent=True) or {}
    user_identity = body.get('identity') or request.args.get('identity')
    room_name = body.get('room') or request.args.get('room')
    user_name = body.get('name') or request.args.get('name')

    # Defaults
    if not user_identity:
        user_identity = f'cust_{uuid.uuid4().hex[:8]}'
    if not room_name:
        room_name = f'support_{user_identity}'
    if not user_name:
        user_name = 'Valued Customer'

    try:
        token = generate_livekit_token(
            identity=user_identity,
            room_name=room_name,
            name=user_name,
        )
        return success_response({
            'token': token,
            'url': Config.LIVEKIT_URL,
            'room': room_name,
            'identity': user_identity,
            'name': user_name,
            'voice': {
                'id': 'aura-2-cora-en',
                'name': 'Cora',
                'provider': 'deepgram',
                'description': 'Deepgram Aura Cora - gentle, calm, natural female voice in LiveKit',
                'rate': 0.98,
                'pitch': 1.02
            }
        }, message='LiveKit Deepgram Cora voice session token generated successfully')
    except Exception as e:
        return error_response(f'Failed to generate LiveKit token: {str(e)}', 500)


@livekit_bp.route('/tts', methods=['POST'])
def livekit_tts():
    """
    Text-to-speech voice bridge endpoint configured for Deepgram Cora.
    """
    body = request.get_json(silent=True) or {}
    text = body.get('text', '')
    voice_id = body.get('voice_id', 'aura-2-cora-en')

    return success_response({
        'text': text,
        'voice_id': voice_id,
        'voice_name': 'Cora',
        'provider': 'deepgram',
        'persona': 'Deepgram Aura Cora (LiveKit)',
        'rate': 0.98,
        'pitch': 1.02,
        'voice_model': 'aura-2-cora-en'
    }, message='Deepgram Cora voice profile active')


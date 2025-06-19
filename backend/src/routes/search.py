from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from src.services.file_discovery import FileDiscoveryService
import json

search_bp = Blueprint('search', __name__)
file_service = FileDiscoveryService()

@search_bp.route('/discover-locations', methods=['GET'])
@cross_origin()
def discover_locations():
    """Discover accessible storage locations"""
    try:
        locations = file_service.discover_storage_locations()
        return jsonify({
            'success': True,
            'locations': locations
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@search_bp.route('/search', methods=['POST'])
@cross_origin()
def search_files():
    """Search for files based on terms and locations"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        search_paths = data.get('paths', [])
        search_terms = data.get('terms', [])
        search_content = data.get('searchContent', True)
        
        if not search_paths:
            return jsonify({
                'success': False,
                'error': 'No search paths provided'
            }), 400
        
        if not search_terms:
            return jsonify({
                'success': False,
                'error': 'No search terms provided'
            }), 400
        
        # Perform the search
        results = file_service.search_files(search_paths, search_terms, search_content)
        
        return jsonify({
            'success': True,
            'results': results,
            'total': len(results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@search_bp.route('/format-llm', methods=['POST'])
@cross_origin()
def format_for_llm():
    """Format selected files for LLM consumption"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        selected_files = data.get('files', [])
        search_terms = data.get('terms', [])
        
        if not selected_files:
            return jsonify({
                'success': False,
                'error': 'No files selected'
            }), 400
        
        # Format for LLM
        formatted_content = file_service.format_for_llm(selected_files, search_terms)
        
        return jsonify({
            'success': True,
            'formatted_content': formatted_content
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@search_bp.route('/file-content/<path:file_path>', methods=['GET'])
@cross_origin()
def get_file_content(file_path):
    """Get full content of a specific file"""
    try:
        from pathlib import Path
        
        # Security check - ensure file exists and is readable
        path = Path(file_path)
        if not path.exists() or not path.is_file():
            return jsonify({
                'success': False,
                'error': 'File not found'
            }), 404
        
        content = file_service._extract_text_content(path)
        file_info = {
            'path': str(path),
            'name': path.name,
            'size': path.stat().st_size,
            'type': file_service._get_file_type(path),
            'content': content
        }
        
        return jsonify({
            'success': True,
            'file': file_info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


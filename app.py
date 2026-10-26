from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)
DATA_FILE = os.path.join(app.root_path, 'data', 'roadmap.json')

def read_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def write_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/')
def index(): return render_template('index.html')

@app.route('/expertise')
@app.route('/expertise')
@app.route('/roadmap')
def roadmap():
    from flask import redirect
    return redirect('/expertise')

def expertise(): return render_template('roadmap.html')


@app.route('/projects')
def projects():
    return render_template('projects.html')
@app.route('/books')
def books(): return render_template('books.html')

@app.route('/contact')
def contact(): return render_template('contact.html')

@app.route('/admin')
def admin(): return render_template('admin.html')

@app.route('/api/roadmap')
def get_roadmap(): return jsonify(read_data())

@app.route('/api/admin/node', methods=['POST'])
def save_node():
    data = read_data()
    new_node = request.json
    existing = next((n for n in data['nodes'] if n['id'] == new_node['id']), None)
    if existing: existing.update(new_node)
    else: data['nodes'].append(new_node)
    write_data(data)
    return jsonify({"status": "success"})

@app.route('/api/admin/node/<node_id>', methods=['DELETE'])
def delete_node(node_id):
    data = read_data()
    data['nodes'] = [n for n in data['nodes'] if n['id'] != node_id]
    data['links'] = [l for l in data['links'] if l['source'] != node_id and l['target'] != node_id]
    write_data(data)
    return jsonify({"status": "success"})

@app.route('/api/admin/link', methods=['POST'])
def save_link():
    data = read_data()
    new_link = request.json
    existing = next((l for l in data['links'] if l['source'] == new_link['source'] and l['target'] == new_link['target']), None)
    if not existing:
        data['links'].append(new_link)
        write_data(data)
    return jsonify({"status": "success"})

@app.route('/api/admin/link', methods=['DELETE'])
def delete_link():
    data = read_data()
    link_data = request.json
    data['links'] = [l for l in data['links'] if not (l['source'] == link_data['source'] and l['target'] == link_data['target'])]
    write_data(data)
    return jsonify({"status": "success"})


# --- API LIKE (THẢ TYM) ---
LIKES_FILE = os.path.join(app.root_path, 'data', 'likes.json')

def read_likes():
    if os.path.exists(LIKES_FILE):
        with open(LIKES_FILE, 'r') as f: return json.load(f)
    return {"count": 0}

@app.route('/api/likes', methods=['GET'])
def get_likes():
    return jsonify(read_likes())

@app.route('/api/like', methods=['POST'])
def add_like():
    likes = read_likes()
    likes["count"] += 1
    with open(LIKES_FILE, 'w') as f: json.dump(likes, f)
    return jsonify(likes)

# --- API LƯU NOTE CÁ NHÂN (SECOND BRAIN) ---
@app.route('/api/node/note', methods=['POST'])
def save_note():
    payload = request.json
    node_id = payload.get('id')
    note_text = payload.get('note')
    
    data = read_data()
    node = next((n for n in data['nodes'] if n['id'] == node_id), None)
    
    if node:
        node['note'] = note_text
        write_data(data)
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Node not found"}), 404

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
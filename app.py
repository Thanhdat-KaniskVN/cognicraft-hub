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

@app.route('/roadmap')
def roadmap(): return render_template('roadmap.html')

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
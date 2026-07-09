import json
import re
import traceback

log_path = r"C:\Users\Sanjana\.gemini\antigravity\brain\a7e42d57-bc30-4fc0-ba0d-98570f918929\.system_generated\logs\transcript_full.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def extract_for_file(filename):
    for idx, line in enumerate(lines):
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                tool_calls = data.get('tool_calls', [])
                for tc in tool_calls:
                    if tc.get('name') == 'view_file' and filename in tc.get('args', {}).get('AbsolutePath', ''):
                        print(f"Found {filename} view_file call at index {idx} (step_index {data.get('step_index')})")
                        for j in range(idx + 1, len(lines)):
                            sub_data = json.loads(lines[j])
                            if sub_data.get('type') == 'SYSTEM_RESPONSE':
                                content = sub_data.get('content', '')
                                lines_clean = []
                                for l in content.split('\n'):
                                    m = re.match(r'^\s*(\d+):\s(.*)$', l)
                                    if m:
                                        lines_clean.append(m.group(2))
                                    else:
                                        if "The following code has been modified" in l or "File Path:" in l or "Total Lines:" in l or "Showing lines" in l:
                                            continue
                                        lines_clean.append(l)
                                output_name = f"original_{filename.replace('/', '_')}_{data.get('step_index')}.tsx"
                                with open(output_name, "w", encoding="utf-8") as out:
                                    out.write('\n'.join(lines_clean))
                                print(f"Successfully wrote {output_name}")
                                return
        except Exception as e:
            print(f"Error at index {idx}: {e}")
            traceback.print_exc()

extract_for_file("LeafletMap.tsx")
extract_for_file("LeafletHeatmap.tsx")

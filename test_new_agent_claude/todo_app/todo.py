#!/usr/bin/env python3
"""Small CLI todo app. Tasks are stored in a JSON file."""
import argparse
import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

DEFAULT_FILE = Path(__file__).parent / "tasks.json"


class TodoError(Exception):
    """A user-facing error (exit code 1)."""


def load_tasks(path):
    """Return the data dict; a missing file means an empty list."""
    path = Path(path)
    if not path.exists():
        return {"next_id": 1, "tasks": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise TodoError(f"{path} is not valid JSON ({e}); fix or remove it") from e
    if (
        not isinstance(data, dict)
        or not isinstance(data.get("tasks"), list)
        or not isinstance(data.get("next_id"), int)
    ):
        raise TodoError(f"{path} has an unexpected format; fix or remove it")
    return data


def save_tasks(path, data):
    """Write atomically: temp file in the same dir, then os.replace."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def add_task(data, text):
    text = text.strip()
    if not text:
        raise TodoError("task text cannot be empty")
    task = {
        "id": data["next_id"],
        "text": text,
        "done": False,
        "created": datetime.now().isoformat(timespec="seconds"),
        "completed": None,
    }
    data["tasks"].append(task)
    data["next_id"] += 1
    return task


def find_task(data, task_id):
    for task in data["tasks"]:
        if task["id"] == task_id:
            return task
    raise TodoError(f"no task with id {task_id}")


def mark_done(data, task_id):
    """Return (task, changed); marking a done task again is not an error."""
    task = find_task(data, task_id)
    if task["done"]:
        return task, False
    task["done"] = True
    task["completed"] = datetime.now().isoformat(timespec="seconds")
    return task, True


def delete_task(data, task_id):
    task = find_task(data, task_id)
    data["tasks"].remove(task)
    return task


def format_tasks(tasks):
    if not tasks:
        return "No tasks."
    return "\n".join(
        f"[{'x' if t['done'] else ' '}] {t['id']}: {t['text']}"
        for t in sorted(tasks, key=lambda t: t["id"])
    )


def build_parser():
    p = argparse.ArgumentParser(description="Simple todo list.")
    p.add_argument(
        "--file",
        default=os.environ.get("TODO_FILE") or str(DEFAULT_FILE),
        help="tasks file (default: $TODO_FILE or tasks.json next to todo.py)",
    )
    sub = p.add_subparsers(dest="command", required=True)
    a = sub.add_parser("add", help="add a task (use -- before text starting with '-')")
    a.add_argument("text")
    ls = sub.add_parser("list", help="list tasks")
    g = ls.add_mutually_exclusive_group()
    g.add_argument("--all", action="store_const", dest="filter", const="all")
    g.add_argument("--pending", action="store_const", dest="filter", const="pending")
    g.add_argument("--done", action="store_const", dest="filter", const="done")
    ls.set_defaults(filter="all")
    for name in ("done", "delete"):
        s = sub.add_parser(name, help=f"{name} a task by id")
        s.add_argument("id", type=int)
    return p


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        data = load_tasks(args.file)
        if args.command == "add":
            task = add_task(data, args.text)
            save_tasks(args.file, data)
            print(f"Added {task['id']}: {task['text']}")
        elif args.command == "list":
            tasks = data["tasks"]
            if args.filter == "pending":
                tasks = [t for t in tasks if not t["done"]]
            elif args.filter == "done":
                tasks = [t for t in tasks if t["done"]]
            print(format_tasks(tasks))
        elif args.command == "done":
            task, changed = mark_done(data, args.id)
            if changed:
                save_tasks(args.file, data)
                print(f"Done {task['id']}: {task['text']}")
            else:
                print(f"Task {task['id']} is already done.")
        elif args.command == "delete":
            task = delete_task(data, args.id)
            save_tasks(args.file, data)
            print(f"Deleted {task['id']}: {task['text']}")
    except TodoError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

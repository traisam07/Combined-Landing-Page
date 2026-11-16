import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path

import todo


class TodoTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.path = Path(self._tmp.name) / "tasks.json"

    def run_cli(self, *argv):
        """Run main() against the temp file; return (code, stdout, stderr)."""
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = todo.main(["--file", str(self.path), *argv])
        return code, out.getvalue(), err.getvalue()

    def read(self):
        return json.loads(self.path.read_text(encoding="utf-8"))

    def test_missing_file_lists_empty(self):
        code, out, _ = self.run_cli("list")
        self.assertEqual(code, 0)
        self.assertEqual(out.strip(), "No tasks.")
        self.assertFalse(self.path.exists())

    def test_add_and_list(self):
        self.assertEqual(self.run_cli("add", "  Buy milk  ")[0], 0)
        self.run_cli("add", "Write code")
        _, out, _ = self.run_cli("list")
        self.assertEqual(out.splitlines(), ["[ ] 1: Buy milk", "[ ] 2: Write code"])
        task = self.read()["tasks"][0]
        self.assertEqual(task["text"], "Buy milk")
        self.assertFalse(task["done"])
        self.assertIsNone(task["completed"])

    def test_add_empty_text_errors(self):
        for text in ("", "   "):
            code, _, err = self.run_cli("add", text)
            self.assertEqual(code, 1)
            self.assertIn("empty", err)
        self.assertFalse(self.path.exists())

    def test_done_and_filters(self):
        self.run_cli("add", "a")
        self.run_cli("add", "b")
        code, out, _ = self.run_cli("done", "1")
        self.assertEqual(code, 0)
        self.assertIn("Done 1", out)
        self.assertIsNotNone(self.read()["tasks"][0]["completed"])
        self.assertEqual(self.run_cli("list", "--done")[1].strip(), "[x] 1: a")
        self.assertEqual(self.run_cli("list", "--pending")[1].strip(), "[ ] 2: b")
        self.assertEqual(len(self.run_cli("list", "--all")[1].splitlines()), 2)
        self.assertEqual(len(self.run_cli("list")[1].splitlines()), 2)

    def test_done_twice_is_idempotent(self):
        self.run_cli("add", "a")
        self.run_cli("done", "1")
        completed = self.read()["tasks"][0]["completed"]
        code, out, err = self.run_cli("done", "1")
        self.assertEqual(code, 0)
        self.assertIn("already done", out)
        self.assertEqual(err, "")
        self.assertEqual(self.read()["tasks"][0]["completed"], completed)

    def test_unknown_id_errors(self):
        self.run_cli("add", "a")
        for cmd in ("done", "delete"):
            code, _, err = self.run_cli(cmd, "99")
            self.assertEqual(code, 1)
            self.assertIn("no task with id 99", err)

    def test_non_integer_id_is_argparse_error(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as cm:
                self.run_cli("done", "abc")
        self.assertEqual(cm.exception.code, 2)

    def test_delete_and_id_not_reused(self):
        self.run_cli("add", "a")
        self.run_cli("add", "b")
        code, out, _ = self.run_cli("delete", "2")
        self.assertEqual(code, 0)
        self.assertIn("Deleted 2", out)
        self.run_cli("add", "c")
        ids = [t["id"] for t in self.read()["tasks"]]
        self.assertEqual(ids, [1, 3])

    def test_persistence_across_invocations(self):
        self.run_cli("add", "a")
        self.run_cli("done", "1")
        # fresh load from disk
        data = todo.load_tasks(self.path)
        self.assertTrue(data["tasks"][0]["done"])
        self.assertEqual(data["next_id"], 2)

    def test_corrupt_json_errors_and_is_not_overwritten(self):
        for content in ("", "{not json"):
            self.path.write_text(content, encoding="utf-8")
            for argv in (("list",), ("add", "x")):
                code, _, err = self.run_cli(*argv)
                self.assertEqual(code, 1)
                self.assertIn("not valid JSON", err)
            self.assertEqual(self.path.read_text(encoding="utf-8"), content)

    def test_wrong_shape_errors(self):
        for content in ("[]", '{"tasks": "x", "next_id": 1}', '{"tasks": []}'):
            self.path.write_text(content, encoding="utf-8")
            code, _, err = self.run_cli("list")
            self.assertEqual(code, 1)
            self.assertIn("unexpected format", err)
            self.assertEqual(self.path.read_text(encoding="utf-8"), content)

    def test_unicode_text(self):
        self.run_cli("add", "Café ☕ 日本語")
        self.assertIn("Café ☕ 日本語", self.run_cli("list")[1])
        self.assertIn("Café ☕ 日本語", self.path.read_text(encoding="utf-8"))

    def test_text_starting_with_dash_needs_double_dash(self):
        code, _, _ = self.run_cli("add", "--", "-dash task")
        self.assertEqual(code, 0)
        self.assertEqual(self.read()["tasks"][0]["text"], "-dash task")

    def test_missing_parent_dir_is_created(self):
        self.path = Path(self._tmp.name) / "sub" / "dir" / "tasks.json"
        self.assertEqual(self.run_cli("add", "a")[0], 0)
        self.assertTrue(self.path.exists())

    def test_atomic_write_leaves_no_temp_files(self):
        self.run_cli("add", "a")
        self.assertEqual(os.listdir(self._tmp.name), ["tasks.json"])

    def test_todo_file_env_var(self):
        env_path = Path(self._tmp.name) / "env.json"
        old = os.environ.get("TODO_FILE")
        os.environ["TODO_FILE"] = str(env_path)
        try:
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                self.assertEqual(todo.main(["add", "via env"]), 0)
        finally:
            if old is None:
                del os.environ["TODO_FILE"]
            else:
                os.environ["TODO_FILE"] = old
        self.assertTrue(env_path.exists())


if __name__ == "__main__":
    unittest.main()

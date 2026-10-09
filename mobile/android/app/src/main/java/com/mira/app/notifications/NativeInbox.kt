package com.mira.app.notifications

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Captured notifications waiting for JavaScript, kept on disk so nothing is lost while the app
 * is closed. Each row is handed over once and then deleted.
 */
class NativeInbox private constructor(context: Context) :
    SQLiteOpenHelper(context, "mira_inbox.db", null, 1) {

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE inbox (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT NOT NULL)")
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {}

  @Synchronized
  fun add(captured: Captured) {
    val values = ContentValues()
    values.put("json", captured.toJson())
    writableDatabase.insert("inbox", null, values)
  }

  /** Returns every waiting notification as a JSON array and removes them. */
  @Synchronized
  fun drain(): String {
    val db = writableDatabase
    val rows = ArrayList<String>()
    var lastId = -1L
    db.rawQuery("SELECT id, json FROM inbox ORDER BY id", null).use { cursor ->
      while (cursor.moveToNext()) {
        lastId = cursor.getLong(0)
        rows.add(cursor.getString(1))
      }
    }
    if (lastId >= 0) db.delete("inbox", "id <= ?", arrayOf(lastId.toString()))
    return rows.joinToString(separator = ",", prefix = "[", postfix = "]")
  }

  companion object {
    @Volatile private var instance: NativeInbox? = null

    fun get(context: Context): NativeInbox =
        instance
            ?: synchronized(this) {
              instance ?: NativeInbox(context.applicationContext).also { instance = it }
            }
  }
}

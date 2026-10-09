package com.mira.app.notifications

import android.content.Context

/** The apps the user has switched on. JavaScript writes the list; the listener reads it. */
object EnabledPackages {
  private const val PREFS = "mira"
  private const val KEY = "enabled_packages"

  @Volatile private var cached: Set<String>? = null

  fun get(context: Context): Set<String> =
      cached
          ?: (context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getStringSet(KEY, null)
                  ?: emptySet())
              .toSet()
              .also { cached = it }

  fun set(context: Context, packages: Set<String>) {
    cached = packages.toSet()
    context
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .edit()
        .putStringSet(KEY, packages)
        .apply()
  }
}

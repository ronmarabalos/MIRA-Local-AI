package com.mira.app.documents

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.provider.OpenableColumns
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import java.util.zip.ZipInputStream
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory

/** The text of one document the user picked, read on the phone. */
data class DocumentText(val name: String, val text: String, val pages: Int, val usedOcr: Boolean)

class UnsupportedDocument : Exception("That kind of file can't be read.")

/**
 * Reads text from a document on the phone: Word (.docx), plain text, PDFs,
 * and, through on-device text recognition, scanned PDFs and photos. Nothing
 * leaves the phone. Holds no product logic: JavaScript decides what to do
 * with the text.
 */
object DocumentReader {
  /** More text than this is cut; the model only ever reads a few passages. */
  private const val MAX_CHARS = 200_000
  /** Scanned pages are read up to this many, so a long scan cannot run for minutes. */
  private const val MAX_OCR_PAGES = 20
  /** Fewer letters than this per page means the PDF is a scan. */
  private const val SCAN_CHARS_PER_PAGE = 40

  fun read(context: Context, uri: Uri): DocumentText {
    val name = displayName(context, uri)
    val type = context.contentResolver.getType(uri) ?: ""
    val lower = name.lowercase()
    return when {
      type == "application/pdf" || lower.endsWith(".pdf") -> readPdf(context, uri, name)
      type.endsWith("wordprocessingml.document") || lower.endsWith(".docx") ->
          DocumentText(name, cap(readDocx(context, uri)), 1, false)
      type.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md") ->
          DocumentText(name, cap(readPlain(context, uri)), 1, false)
      type.startsWith("image/") -> DocumentText(name, cap(recognize(InputImage.fromFilePath(context, uri))), 1, true)
      else -> throw UnsupportedDocument()
    }
  }

  private fun cap(text: String) = if (text.length > MAX_CHARS) text.substring(0, MAX_CHARS) else text

  private fun displayName(context: Context, uri: Uri): String =
      context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
        if (it.moveToFirst() && !it.isNull(0)) it.getString(0) else null
      } ?: "Document"

  private fun readPlain(context: Context, uri: Uri): String =
      context.contentResolver.openInputStream(uri)?.use { it.readBytes().toString(Charsets.UTF_8) } ?: ""

  /** A .docx is a zip; the words are the <w:t> runs of word/document.xml. */
  private fun readDocx(context: Context, uri: Uri): String {
    val input = context.contentResolver.openInputStream(uri) ?: return ""
    ZipInputStream(input).use { zip ->
      while (true) {
        val entry = zip.nextEntry ?: break
        if (entry.name != "word/document.xml") continue
        val parser = XmlPullParserFactory.newInstance().apply { isNamespaceAware = false }.newPullParser()
        parser.setInput(zip, "UTF-8")
        val out = StringBuilder()
        var inText = false
        while (parser.next() != XmlPullParser.END_DOCUMENT && out.length < MAX_CHARS) {
          when (parser.eventType) {
            XmlPullParser.START_TAG ->
                when (parser.name) {
                  "w:t" -> inText = true
                  "w:tab" -> out.append('\t')
                  "w:br" -> out.append('\n')
                }
            XmlPullParser.END_TAG ->
                when (parser.name) {
                  "w:t" -> inText = false
                  "w:p" -> out.append('\n')
                }
            XmlPullParser.TEXT -> if (inText) out.append(parser.text)
          }
        }
        return out.toString()
      }
    }
    return ""
  }

  private fun readPdf(context: Context, uri: Uri, name: String): DocumentText {
    PDFBoxResourceLoader.init(context.applicationContext)
    val (text, pages) =
        context.contentResolver.openInputStream(uri)?.use { input ->
          PDDocument.load(input).use { doc -> PDFTextStripper().getText(doc) to doc.numberOfPages }
        } ?: ("" to 0)
    val letters = text.count { it.isLetterOrDigit() }
    if (pages == 0 || letters >= pages * SCAN_CHARS_PER_PAGE) {
      return DocumentText(name, cap(text), pages, false)
    }
    // Little or no text: a scanned PDF. Draw each page and read it.
    val scanned = StringBuilder()
    context.contentResolver.openFileDescriptor(uri, "r")?.use { fd ->
      PdfRenderer(fd).use { renderer ->
        for (i in 0 until minOf(renderer.pageCount, MAX_OCR_PAGES)) {
          renderer.openPage(i).use { page ->
            // About 150 dpi: sharp enough to read, small enough for the phone's memory.
            val scale = 150f / 72f
            val bitmap =
                Bitmap.createBitmap(
                    (page.width * scale).toInt().coerceAtMost(2000),
                    (page.height * scale).toInt().coerceAtMost(2800),
                    Bitmap.Config.ARGB_8888)
            bitmap.eraseColor(Color.WHITE)
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            scanned.append(recognize(InputImage.fromBitmap(bitmap, 0))).append("\n\n")
            bitmap.recycle()
          }
        }
      }
    }
    return DocumentText(name, cap(scanned.toString()), pages, true)
  }

  /** On-device text recognition; runs on the calling (background) thread. */
  private fun recognize(image: InputImage): String {
    val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    return try {
      Tasks.await(recognizer.process(image)).text
    } finally {
      recognizer.close()
    }
  }
}

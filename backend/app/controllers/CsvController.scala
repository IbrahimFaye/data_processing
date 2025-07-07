package controllers

import javax.inject._
import play.api.mvc._
import utils.{DataCleaner, SparkSessionWrapper}
import java.io.{File, FileWriter}
import java.nio.file.{Files, Paths}
import scala.concurrent.{ExecutionContext, Future}
import play.api.Logger
import org.apache.spark.sql.DataFrame
import models.CleaningConfig

@Singleton
class CsvController @Inject()(cc: ControllerComponents)(implicit ec: ExecutionContext)
  extends AbstractController(cc) with SparkSessionWrapper {

  private val logger = Logger(this.getClass)
  private val uploadsDir = new File("public/uploads")
  private val resultsDir = new File("public/results")
  
  if (!uploadsDir.exists()) uploadsDir.mkdirs()
  if (!resultsDir.exists()) resultsDir.mkdirs()

  // Configuration Hadoop pour Windows
  System.setProperty("hadoop.home.dir", "C:\\hadoop")
  spark.sparkContext.hadoopConfiguration.set("mapreduce.fileoutputcommitter.algorithm.version", "2")

  def upload = Action(parse.multipartFormData).async { request =>
    request.body.file("csv") match {
      case Some(csv) =>
        Future {
          val tempFile = Files.createTempFile("upload_", ".csv").toFile
          try {
            csv.ref.copyTo(tempFile, replace = true)
            
            if (tempFile.length() == 0) {
              BadRequest("Le fichier est vide")
            } else {
              // Configuration de nettoyage
              val config = CleaningConfig(
                handleMissingValues = true,
                handleOutliers = true,
                removeDuplicates = true,
                normalizeData = true
              )
              
              // Traitement des données
              processFile(tempFile, config)
            }
          } catch {
            case e: Exception =>
              logger.error("Erreur de traitement", e)
              InternalServerError(s"Erreur: ${e.getMessage}")
          } finally {
            Files.deleteIfExists(tempFile.toPath)
          }
        }
      case None =>
        Future.successful(BadRequest("Aucun fichier reçu"))
    }
  }

  private def processFile(inputFile: File, config: CleaningConfig): Result = {
    try {
      // 1. Lecture du fichier
      val df = spark.read
        .option("header", "true")
        .option("inferSchema", "true")
        .csv(inputFile.getAbsolutePath)

      logger.info(s"Fichier chargé: ${inputFile.getName} (${df.count()} lignes)")

      // 2. Nettoyage des données
      val cleanedDF = DataCleaner.clean(df, config)
      logger.info(s"Données nettoyées: ${cleanedDF.count()} lignes restantes")

      // 3. Écriture du résultat
      val outputFile = new File(resultsDir, s"cleaned_${System.currentTimeMillis()}.csv")
      writeDataFrameToCsv(cleanedDF, outputFile)

      Ok.sendFile(
        content = outputFile,
        fileName = _ => Some("cleaned_data.csv"), // Correction ici
        onClose = () => Files.deleteIfExists(outputFile.toPath)
      )
    } catch {
      case e: Exception =>
        logger.error("Erreur lors du traitement du fichier", e)
        InternalServerError(s"Erreur de traitement: ${e.getMessage}")
    }
  }

  private def writeDataFrameToCsv(df: DataFrame, outputFile: File): Unit = {
    val writer = new FileWriter(outputFile)
    try {
      // Écriture de l'en-tête
      writer.write(df.columns.mkString(",") + "\n")
      
      // Écriture des données
      df.collect().foreach { row =>
        val line = row.toSeq.map {
          case null => ""
          case value => value.toString
        }.mkString(",")
        writer.write(line + "\n")
      }
    } finally {
      writer.close()
    }
  }
}
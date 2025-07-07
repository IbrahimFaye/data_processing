package utils

import org.apache.spark.sql.{DataFrame, functions => F}
import org.apache.spark.sql.types.{NumericType, StringType}
import models.CleaningConfig

object DataCleaner {
  def clean(df: DataFrame, config: CleaningConfig): DataFrame = {
    var cleanedDF = fixEncodingProblems(df)
    
    if (config.handleMissingValues) cleanedDF = handleMissingValues(cleanedDF)
    if (config.handleOutliers) cleanedDF = handleOutliers(cleanedDF)
    if (config.removeDuplicates) cleanedDF = removeDuplicates(cleanedDF)
    if (config.normalizeData) cleanedDF = safeNormalize(cleanedDF)
    
    cleanedDF
  }

  private def fixEncodingProblems(df: DataFrame): DataFrame = {
    df.columns.foldLeft(df) { (currentDF, colName) =>
      currentDF.schema(colName).dataType match {
        case _: StringType =>
          currentDF.withColumn(colName, 
            F.regexp_replace(
              F.regexp_replace(F.col(colName), "[^\\p{ASCII}]", ""),
              "[\\x00-\\x1F]", ""))
        case _ => currentDF
      }
    }
  }

  private def handleMissingValues(df: DataFrame): DataFrame = {
    df.columns.foldLeft(df) { (currentDF, colName) =>
      currentDF.schema(colName).dataType match {
        case _: NumericType =>
          val median = currentDF.stat.approxQuantile(colName, Array(0.5), 0.01).head
          currentDF.na.fill(median, Seq(colName))
        case _: StringType =>
          currentDF.na.fill("Inconnu", Seq(colName))
        case _ => currentDF
      }
    }
  }

  private def handleOutliers(df: DataFrame): DataFrame = {
    val numericCols = df.schema.fields
      .filter(_.dataType.isInstanceOf[NumericType])
      .map(_.name)
      .filterNot(_ == "id")

    numericCols.foldLeft(df) { (currentDF, colName) =>
      val quantiles = currentDF.stat.approxQuantile(colName, Array(0.25, 0.75), 0.01)
      val Q1 = quantiles(0)
      val Q3 = quantiles(1)
      val IQR = Q3 - Q1
      val lowerBound = Q1 - 1.5 * IQR
      val upperBound = Q3 + 1.5 * IQR
      val median = currentDF.stat.approxQuantile(colName, Array(0.5), 0.01).head

      currentDF.withColumn(colName,
        F.when(F.col(colName) < lowerBound || F.col(colName) > upperBound, median)
         .otherwise(F.col(colName)))
    }
  }

  private def removeDuplicates(df: DataFrame): DataFrame = {
    val colsWithoutId = df.columns.filter(_ != "id")
    df.dropDuplicates(colsWithoutId)
  }

  private def safeNormalize(df: DataFrame): DataFrame = {
    val numericCols = df.schema.fields
      .filter(f => f.dataType.isInstanceOf[NumericType] && f.name != "id")
      .map(_.name)

    numericCols.foldLeft(df) { (currentDF, colName) =>
      val minMax = currentDF.agg(F.min(colName), F.max(colName)).first()
      val minVal = minMax.getDouble(0)
      val maxVal = minMax.getDouble(1)
      val range = maxVal - minVal

      if (range > 0) {
        currentDF.withColumn(colName, 
          F.format_number((F.col(colName) - minVal) / range, 6))
      } else {
        currentDF.withColumn(colName, F.lit(0.0))
      }
    }
  }

  def saveCleanResults(df: DataFrame, path: String): Unit = {
    df.coalesce(1)
      .write
      .option("header", "true")
      .option("encoding", "UTF-8")
      .option("delimiter", "\t")
      .mode("overwrite")
      .csv(path)
  }
}
package utils

import org.apache.spark.sql.SparkSession
import org.apache.spark.SparkConf

trait SparkSessionWrapper {
  lazy val spark: SparkSession = {
    val conf = new SparkConf()
      .setAppName("CSV Processor")
      .setMaster("local[*]")
      .set("spark.sql.warehouse.dir", "file:///C:/temp/spark-warehouse")
      .set("spark.sql.shuffle.partitions", "1")
      .set("spark.ui.enabled", "false")
      .set("spark.hadoop.validateOutputSpecs", "false")
      .set("spark.sql.sources.commitProtocolClass", "org.apache.spark.sql.execution.datasources.SQLHadoopMapReduceCommitProtocol")
      .set("spark.sql.legacy.allowNonEmptyLocationInCTAS", "true")

    SparkSession.builder()
      .config(conf)
      .getOrCreate()
  }
}
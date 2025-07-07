name := "backend"
organization := "sn.esp.iabd"
version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayScala)

scalaVersion := "2.13.16"
libraryDependencies ++= Seq(
  guice,
  "org.scalatestplus.play" %% "scalatestplus-play" % "7.0.1" % Test,
  "org.apache.spark" %% "spark-core" % "3.5.1",
  "org.apache.spark" %% "spark-sql" % "3.5.1",
  "org.apache.commons" % "commons-csv" % "1.10.0",
  // Optionnel: pour la conversion en Pandas si vous utilisez la solution alternative
  // "org.apache.spark" %% "spark-mllib" % "3.5.1" % "provided"
)
// Résolution des conflits
dependencyOverrides ++= Seq(
  "org.scala-lang.modules" %% "scala-xml" % "1.3.0",
  "org.scala-lang.modules" %% "scala-parser-combinators" % "2.3.0"
)

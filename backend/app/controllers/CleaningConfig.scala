package models

case class CleaningConfig(
  handleMissingValues: Boolean = true,
  handleOutliers: Boolean = true,
  removeDuplicates: Boolean = true,
  normalizeData: Boolean = true
)

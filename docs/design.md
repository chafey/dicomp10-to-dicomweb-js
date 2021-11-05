# Design

* The API is streams based
  * Allows optimization of implementation to minimize memory use
  * Enables higher performance "on the fly" implementations
* The scope of the library is minimal
  * Easier to comprehend
  * Lower barrier for new collaborators
  * Lower chance of bugs
  * Easier to build more complex systems from
* Built to be extensible
  * Hooks to transform data
    * Implement work arounds for non standard compliant data sets
    * Implement custom logic (e.g. re-compression of image frames to a proprietary or other format)
    * Implement de-identification
    * Implement de-duplication
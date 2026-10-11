(ns metabase.api-routes.cmd
  (:require
   [metabase.api-routes.routes :as routes]
   [metabase.api.docs :as api.docs]))

(defn generate-openapi-spec!
  "Command to generate openapi spec for api routes."
  []
  (api.docs/write-openapi-spec-to-file! routes/routes))

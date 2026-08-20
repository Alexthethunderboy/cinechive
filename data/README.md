# Shared catalog data

At runtime, CineChive creates `shared-media.json` here. The file is deliberately
ignored by Git because it contains the live private catalog and iCloud link.

Set `SHARED_MEDIA_DATA_FILE` to an absolute path if the self-hosted deployment
uses a separate persistent-data volume.

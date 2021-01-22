# Lumiverse Song Recognition Service

This service was made, to be able to recognise artists and titles of songs from MTA resources and to set their metadata tags. Use this as a drop-in solution if there is no metadata available in the audio files and only if really needed, to avoid any rate-limiting with third-party providers.

This should be used in a Docker environment. To use it outside of a Docker environment, the required dependencies must first be installed, which can be taken from the `Dockerfile`.

### Configuration

All configurations are to be set via environment variables.

| Environment Variable  | Description                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_KEY`\*           | API key which must be sent by all requests.                                                                                                                           |
| `RESOURCES_DIRECTORY` | Full path to the MTA resources directory. (/mta_resources/)                                                                                                           |
| `TEMP_PATH`           | Full path to the temporary song directory. Not needed if `TRIM_AUDIO` is set to `false`. (/tmp_songs/)                                                                |
| `TRIM_AUDIO`          | Toggle wether the audio files should first be trimmed or not, to reduce processing time and CPU stress. Trimmed audio files may not be accurately identified. (false) |
| `TRIM_OFFSET`         | Offset in seconds to start trimming the song. (55)                                                                                                                    |
| `TRIM_LENGTH`         | Length in seconds of the trimmed song. (45)                                                                                                                           |

_\* Required_

### Authentication

To make a valid request, you must provide an API key to identify all authorised requests. This can be done by providing the API key in the `X-API-Key` header of the request.

## <kbd>PUT</kbd> /v1/recognize

Attempts to recognise a song.

#### Queryparameters

| Name                 | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `relativeSongPath`\* | Relative path from the resources folder to the audio file to be recognised. |

_\* Required_

#### Responses

All responses have the content type `application/json`.

| Code | Description                            |
| ---- | -------------------------------------- |
| 200  | OK (Recognised data)                   |
| 400  | Bad request \*                         |
| 401  | Unauthorized (No api key provided)     |
| 404  | Not found (MTA resource was not found) |
| 500  | Internal server error \*               |

_\* `message` property in the response body might provide detailed information on why the request failed_

#### Example request

```sh
➜ curl -X PUT -H "X-API-Key: test" "http://127.0.0.1:3000/v1/recognize?relativeSongPath=-DM-Peek-v4-Phenomenon/assets/music.mp3"
{"success":true,"artist":"Unknown Brain, Dax, Hoober & Vindon","title":"Phenomenon"}
```

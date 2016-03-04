package assets

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"regexp"
	"strings"

	"github.com/openshift/origin/pkg/quota/admission/clusterresourceoverride/api"
	utilruntime "k8s.io/kubernetes/pkg/util/runtime"
)

var varyHeaderRegexp = regexp.MustCompile("\\s*,\\s*")

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
	sniffDone bool
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	if !w.sniffDone {
		if w.Header().Get("Content-Type") == "" {
			w.Header().Set("Content-Type", http.DetectContentType(b))
		}
		w.sniffDone = true
	}
	return w.Writer.Write(b)
}

// GzipHandler wraps a http.Handler to support transparent gzip encoding.
func GzipHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			h.ServeHTTP(w, r)
			return
		}
		// Normalize the Accept-Encoding header for improved caching
		r.Header.Set("Accept-Encoding", "gzip")
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		h.ServeHTTP(&gzipResponseWriter{Writer: gz, ResponseWriter: w}, r)
	})
}

// ReverseProxyHeaderHandler strips all other headers except those whitelisted below
func ReverseProxyHeaderHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxiedHeader := http.Header{}
		proxiedHeader.Add("Accept", r.Header.Get("Accept"))
		proxiedHeader.Add("Accept-Encoding", r.Header.Get("Accept-Encoding"))
		proxiedHeader.Add("Accept-Language", r.Header.Get("Accept-Language"))
		proxiedHeader.Add("Cache-Control", r.Header.Get("Cache-Control"))
		proxiedHeader.Add("Connection", r.Header.Get("Connection"))
		proxiedHeader.Add("Host", r.Header.Get("Host"))
		proxiedHeader.Add("If-None-Match", r.Header.Get("If-None-Match"))
		proxiedHeader.Add("If-Modified-Since", r.Header.Get("If-Modified-Since"))
		proxiedHeader.Add("Referer", r.Header.Get("Referer"))
		proxiedHeader.Add("User-Agent", r.Header.Get("User-Agent"))
		r.Header = proxiedHeader
		h.ServeHTTP(w, r)
	})
}

var versionTemplate = template.Must(template.New("webConsoleVersion").Parse(`
window.OPENSHIFT_VERSION = {
  openshift: "{{ .OpenShiftVersion | js}}",
  kubernetes: "{{ .KubernetesVersion | js}}"
};
`))

type WebConsoleVersion struct {
	KubernetesVersion string
	OpenShiftVersion  string
}

var configTemplate = template.Must(template.New("webConsoleConfig").Parse(`
window.OPENSHIFT_CONFIG = {
  apis: {
    hostPort: "{{ .APIGroupAddr | js}}",
    prefix: "{{ .APIGroupPrefix | js}}"
  },
  api: {
    openshift: {
      hostPort: "{{ .MasterAddr | js}}",
      prefixes: {
        "v1": "{{ .MasterPrefix | js}}"
      },
      resources: {
{{range $i,$e := .MasterResources}}{{if $i}},
{{end}}        "{{$e | js}}": true{{end}}
      }
    },
    k8s: {
      hostPort: "{{ .KubernetesAddr | js}}",
      prefixes: {
      	"v1": "{{ .KubernetesPrefix | js}}"
      },
      resources: {
{{range $i,$e := .KubernetesResources}}{{if $i}},
{{end}}        "{{$e | js}}": true{{end}}
      }
    }
  },
  auth: {
  	oauth_authorize_uri: "{{ .OAuthAuthorizeURI | js}}",
  	oauth_redirect_base: "{{ .OAuthRedirectBase | js}}",
  	oauth_client_id: "{{ .OAuthClientID | js}}",
  	logout_uri: "{{ .LogoutURI | js}}"
  },
  {{ with .LimitRequestOverrides }}
  limitRequestOverrides: {
	limitCPUToMemoryPercent: {{ .LimitCPUToMemoryPercent }},
	cpuRequestToLimitPercent: {{ .CPURequestToLimitPercent }},
	memoryRequestToLimitPercent: {{ .MemoryRequestToLimitPercent }}
  },
  {{ end }}
  loggingURL: "{{ .LoggingURL | js}}",
  metricsURL: "{{ .MetricsURL | js}}"
};
`))

type WebConsoleConfig struct {
	// APIGroupAddr is the host:port the UI should call the API groups on. Scheme is derived from the scheme the UI is served on, so they must be the same.
	APIGroupAddr string
	// APIGroupPrefix is the API group context root
	APIGroupPrefix string
	// MasterAddr is the host:port the UI should call the master API on. Scheme is derived from the scheme the UI is served on, so they must be the same.
	MasterAddr string
	// MasterPrefix is the OpenShift API context root
	MasterPrefix string
	// MasterResources holds resource names for the OpenShift API
	MasterResources []string
	// KubernetesAddr is the host:port the UI should call the kubernetes API on. Scheme is derived from the scheme the UI is served on, so they must be the same.
	// TODO this is probably unneeded since everything goes through the openshift master's proxy
	KubernetesAddr string
	// KubernetesPrefix is the Kubernetes API context root
	KubernetesPrefix string
	// KubernetesResources holds resource names for the Kubernetes API
	KubernetesResources []string
	// OAuthAuthorizeURI is the OAuth2 endpoint to use to request an API token. It must support request_type=token.
	OAuthAuthorizeURI string
	// OAuthRedirectBase is the base URI of the web console. It must be a valid redirect_uri for the OAuthClientID
	OAuthRedirectBase string
	// OAuthClientID is the OAuth2 client_id to use to request an API token. It must be authorized to redirect to the web console URL.
	OAuthClientID string
	// LogoutURI is an optional (absolute) URI to redirect to after completing a logout. If not specified, the built-in logout page is shown.
	LogoutURI string
	// LoggingURL is the endpoint for logging (optional)
	LoggingURL string
	// MetricsURL is the endpoint for metrics (optional)
	MetricsURL string
	// LimitRequestOverrides contains the ratios for overriding request/limit on containers.
	// Applied in order:
	//   LimitCPUToMemoryPercent
	//   CPURequestToLimitPercent
	//   MemoryRequestToLimitPercent
	LimitRequestOverrides *api.ClusterResourceOverrideConfig
}

func GeneratedConfigHandler(config WebConsoleConfig, version WebConsoleVersion) (http.Handler, error) {
	var buffer bytes.Buffer
	if err := configTemplate.Execute(&buffer, config); err != nil {
		return nil, err
	}
	if err := versionTemplate.Execute(&buffer, version); err != nil {
		return nil, err
	}
	content := buffer.Bytes()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Cache-Control", "no-cache, no-store")
		w.Header().Add("Content-Type", "application/javascript")
		if _, err := w.Write(content); err != nil {
			utilruntime.HandleError(fmt.Errorf("Error serving Web Console config and version: %v", err))
		}
	}), nil
}

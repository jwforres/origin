package selectprovider

// TODO JWF dont like that this is currently in handlers but it needs access to stuff in handlers and stuff in handlers needs access to it so would have to move some types into a separate package to move it out

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/openshift/origin/pkg/auth/oauth/handlers"
	"k8s.io/kubernetes/pkg/util"
)

const (
	useRedirectHandlerParam = "useRedirectHandler"
)

type SelectProviderRenderer interface {
	Render(redirectors []handlers.ProviderInfo, w http.ResponseWriter, req *http.Request)
}

type SelectProvider struct {
	render            SelectProviderRenderer
	forceInterstitial bool
}

var _ = handlers.AuthenticationSelectionHandler(&SelectProvider{})

func NewSelectProvider(render SelectProviderRenderer, forceInterstitial bool) *SelectProvider {
	return &SelectProvider{
		render:            render,
		forceInterstitial: forceInterstitial,
	}
}

type ProviderData struct {
	// TODO JWF should be an array for consistent ordering but have to plumb that all the way through...
	Providers []handlers.ProviderInfo
}

// NewSelectProviderRenderer creates a select provider renderer that takes in an optional custom template to
// allow branding of the page. Uses the default if customSelectProviderTemplateFile is not set.
func NewSelectProviderRenderer(customSelectProviderTemplateFile string) (*selectProviderTemplateRenderer, error) {
	r := &selectProviderTemplateRenderer{}
	if len(customSelectProviderTemplateFile) > 0 {
		customTemplate, err := template.ParseFiles(customSelectProviderTemplateFile)
		if err != nil {
			return nil, err
		}
		r.selectProviderTemplate = customTemplate
	} else {
		r.selectProviderTemplate = defaultSelectProviderTemplate
	}

	return r, nil
}

func (s *SelectProvider) SelectAuthentication(providers []handlers.ProviderInfo, w http.ResponseWriter, req *http.Request) (handlers.ProviderInfo, bool, error) {
	if len(providers) == 0 {
		return handlers.ProviderInfo{}, false, nil
	}

	if len(providers) == 1 && !s.forceInterstitial {
		return providers[0], false, nil
	}

	s.render.Render(providers, w, req)
	return handlers.ProviderInfo{}, true, nil
}

// TODO JWF validate the selectProvider template
// func ValidateSelectProviderTemplate(templateContent []byte) []error {
//  var allErrs []error

//  template, err := template.New("loginTemplateTest").Parse(string(templateContent))
//  if err != nil {
//    return append(allErrs, err)
//  }

//  // Execute the template with dummy values and check if they're there.
//  form := LoginForm{
//    Action: "MyAction",
//    Error:  "MyError",
//    Names: LoginFormFields{
//      Then:     "MyThenName",
//      CSRF:     "MyCSRFName",
//      Username: "MyUsernameName",
//      Password: "MyPasswordName",
//    },
//    Values: LoginFormFields{
//      Then:     "MyThenValue",
//      CSRF:     "MyCSRFValue",
//      Username: "MyUsernameValue",
//    },
//  }

//  var buffer bytes.Buffer
//  err = template.Execute(&buffer, form)
//  if err != nil {
//    return append(allErrs, err)
//  }
//  output := buffer.Bytes()

//  var testFields = map[string]string{
//    "Action":          form.Action,
//    "Error":           form.Error,
//    "Names.Then":      form.Names.Then,
//    "Names.CSRF":      form.Values.CSRF,
//    "Names.Username":  form.Names.Username,
//    "Names.Password":  form.Names.Password,
//    "Values.Then":     form.Values.Then,
//    "Values.CSRF":     form.Values.CSRF,
//    "Values.Username": form.Values.Username,
//  }

//  for field, value := range testFields {
//    if !bytes.Contains(output, []byte(value)) {
//      allErrs = append(allErrs, errors.New(fmt.Sprintf("template is missing parameter {{ .%s }}", field)))
//    }
//  }

//  return allErrs
// }

type selectProviderTemplateRenderer struct {
	selectProviderTemplate *template.Template
}

func (r selectProviderTemplateRenderer) Render(providers []handlers.ProviderInfo, w http.ResponseWriter, req *http.Request) {
	w.Header().Add("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	if err := r.selectProviderTemplate.Execute(w, ProviderData{Providers: providers}); err != nil {
		util.HandleError(fmt.Errorf("unable to render select provider template: %v", err))
	}
}

// SelectProviderTemplateExample is a basic template for customizing the provider selection page.
const SelectProviderTemplateExample = `<!DOCTYPE html>
<!--

This template can be modified and used to customize the provider selection page. To replace
the provider selection page, set master configuration option oauthConfig.templates.selectProvider to
the path of the template file. Don't remove parameters in curly braces below.

oauthConfig:
  templates:
    selectProvider: templates/select-provider-template.html

-->
<html>
  <head>
    <title>Select a provider</title>
    <style type="text/css">
      body {
        font-family: "Open Sans", Helvetica, Arial, sans-serif;
        font-size: 14px;
        margin: 15px;
      }

      input {
        margin-bottom: 10px;
        width: 300px;
      }

      .error {
        color: red;
        margin-bottom: 10px;
      }
    </style>
  </head>
  <body>

    {{ range $redirectorName, $redirector := .Redirectors }}
      <div class="error">{{ $redirectorName }}</div>
    {{ end }}

  </body>
</html>
`

var defaultSelectProviderTemplate = template.Must(template.New("defaultSelectProvider").Parse(defaultSelectProviderTemplateString))

const defaultSelectProviderTemplateString = `<!DOCTYPE html>
<html>
  <head>
    <title>Login</title>
    <style type="text/css">
      body {
        font-family: "Open Sans", Helvetica, Arial, sans-serif;
        font-size: 14px;
        margin: 15px;
      }
    </style>
  </head>
  <body>

    {{ range $provider := .Providers }}
			<div>
      <a href="{{$provider.URL}}">{{$provider.ID}}</a>
			</div>
    {{ end }}

  </body>
</html>
`

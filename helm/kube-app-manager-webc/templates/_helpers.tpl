{{- define "kube-app-manager-webc.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "kube-app-manager-webc.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "kube-app-manager-webc.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "kube-app-manager-webc.labels" -}}
app.kubernetes.io/name: {{ include "kube-app-manager-webc.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "kube-app-manager-webc.selectorLabels" -}}
app.kubernetes.io/name: {{ include "kube-app-manager-webc.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "kube-app-manager-webc.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "kube-app-manager-webc.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "kube-app-manager-webc.appsBackendUrl" -}}
{{- if .Values.appsBackendUrl -}}
{{- .Values.appsBackendUrl -}}
{{- else -}}
{{- printf "https://%s/apps" .Values.ingress.host -}}
{{- end -}}
{{- end -}}

{{- define "kube-app-manager-webc.tlsSecretName" -}}
{{- if .Values.ingress.tls.secretName -}}
{{- .Values.ingress.tls.secretName -}}
{{- else -}}
{{- printf "%s-tls" (include "kube-app-manager-webc.fullname" .) -}}
{{- end -}}
{{- end -}}

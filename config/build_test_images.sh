#!/usr/bin/env bash
# Build test images, tag as "latest" by default

# Optional (with defaults)
GIT_REFERENCE=${GIT_REFERENCE:-$(git rev-parse HEAD)}
GIT_URL=${GIT_URL:-https://github.com/afrittoli/openstack-health}
IMAGES_BASE_URL=${IMAGES_BASE_URL:-registry.ng.bluemix.net/andreaf}
IMAGE_TAG=${IMAGE_TAG:-latest}
USE_IMAGE_CACHE=${USE_IMAGE_CACHE:-"true"}
# Test Images
TESTIMAGES=${TESTIMAGES:-"node"}

BASEDIR=$(ROOT=$(dirname $0); cd $ROOT; pwd)

# Variables
declare -A IMAGE_RESOURCES

echo "Buildin @$GIT_REFERENCE, IMAGE_TAG: $IMAGE_TAG"

## Setup resources
# GIT
GIT_RESOURCE=$(cat <<EOF | kubectl create -n dev -o jsonpath='{.metadata.name}' -f -
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  generateName: health-helm-git-knative-
  labels:
    app: health
    tag: "$IMAGE_TAG"
spec:
  type: git
  params:
    - name: revision
      value: $GIT_REFERENCE
    - name: url
      value: $GIT_URL
EOF
)

# Images
for TESTIMAGE in $TESTIMAGES; do
  IMAGE_RESOURCES[$TESTIMAGE]=$(cat <<EOF | kubectl create -n dev -o jsonpath='{.metadata.name}' -f -
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  generateName: health-test-$TESTIMAGE-image-
  labels:
    app: health
    tag: "$IMAGE_TAG"
spec:
  type: image
  params:
    - name: url
      description: The target URL
      value: $IMAGES_BASE_URL/health-test-$TESTIMAGE
EOF
)
done

## Source to image
for TESTIMAGE in $TESTIMAGES; do
  cat <<EOF | kubectl create -n dev -f -
apiVersion: tekton.dev/v1alpha1
kind: TaskRun
metadata:
  generateName: source-to-image-health-test-$TESTIMAGE-
  labels:
    app: health
    component: test-$TESTIMAGE
    tag: "$IMAGE_TAG"
spec:
  taskRef:
    name: source-to-image
  trigger:
    type: manual
  inputs:
    resources:
      - name: workspace
        resourceRef:
          name: $GIT_RESOURCE
    params:
      - name: pathToContext
        value: images/test/$TESTIMAGE
      - name: imageTag
        value: "$IMAGE_TAG"
  outputs:
    resources:
      - name: builtImage
        resourceRef:
          name: ${IMAGE_RESOURCES[$TESTIMAGE]}
EOF
done

# Watch command
echo "watch kubectl get all -l tag=$IMAGE_TAG -n dev"

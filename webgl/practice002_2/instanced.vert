#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

// ============================================================================
uniform float time; // 時間の経過 @@@
// ============================================================================

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	// #include <project_vertex> ================================================
	// project_vertexのチャンクに加工を加えたいので、includeをコメントアウトし、加工を加えた内容をベタ貼り
vec4 mvPosition = vec4( transformed, 1.0 );

// ここで mvPosition に対して行った変更は、ローカル空間の頂点に対する変更と同義となる @@@
// 原点からどれくらいx方向に離れているかと、と、sin波を乗算して、Yに代入している
// => 羽根の先端ほど上下運動が大きくなる
float move = sin(time) * abs(mvPosition.x);
mvPosition.y += move * 0.5;

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;
	// #include <project_vertex> ================================================
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>

}
import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
import COLORS from "../../../services/colors"

const UserSvg = (props: SvgProps) => (
	<Svg
		width={24}
		height={24}
		viewBox='0 0 24 24'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<Path
			fill={COLORS.MAIN}
			d='M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM14.682 14H9.318c-.483 0-.724 0-.94.046-.747.16-1.393.72-1.755 1.523-.104.232-.18.507-.333 1.059-.183.662-.275.993-.287 1.26-.044.943.465 1.794 1.221 2.042.215.07.505.07 1.084.07h7.384c.58 0 .87 0 1.084-.07.756-.248 1.265-1.1 1.221-2.042-.012-.267-.104-.598-.287-1.26-.153-.552-.229-.827-.334-1.059-.361-.803-1.007-1.363-1.754-1.523-.216-.046-.457-.046-.94-.046Z'
			stroke={COLORS.MAIN}
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</Svg>
)

export default UserSvg

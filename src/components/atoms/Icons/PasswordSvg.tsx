import * as React from "react"
import Svg, { SvgProps, Path, Circle } from "react-native-svg"
import COLORS from "../../../services/colors"

const PasswordSvg = (props: SvgProps) => (
	<Svg
		width={24}
		height={24}
		viewBox='0 0 32 32'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<Path
			fill={COLORS.MAIN}
			d='M21 2a8.998 8.998 0 0 0-8.612 11.612L2 24v6h6l10.388-10.388A9 9 0 1 0 21 2Zm0 16a7.013 7.013 0 0 1-2.032-.302l-1.147-.348-.847.847-3.181 3.181L12.414 20 11 21.414l1.379 1.379-1.586 1.586L9.414 23 8 24.414l1.379 1.379L7.172 28H4v-3.172l9.802-9.802.848-.847-.348-1.147A7 7 0 1 1 21 18Z'
		/>
		<Circle cx={22} cy={10} r={2} />
		<Path
			data-name='&lt;Transparent Rectangle&gt;'
			style={{
				fill: "none",
			}}
			d='M0 0h32v32H0z'
		/>
	</Svg>
)

export default PasswordSvg

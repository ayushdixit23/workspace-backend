const Membership = require("../models/membership")
const User = require("../models/userAuth")
const Community = require("../models/community")

exports.middlewareMembership = async (req, res, next) => {
	try {
		const { id } = req.params
		const currentDay = Date.now()
		const user = await User.findById(id)

		const membershipid = user.memberships.membership

		const membership = await Membership.findById(membershipid)
		console.log(membership)
		const membershipEndingDate = new Date(user.memberships.ending);


		if (currentDay < membershipEndingDate.getTime()) {
			const productlimit = membership.productlimit
			const topiclimit = membership.topiclimit
			const communitylimit = membership.communitylimit
			const collectionlimit = membership.collectionlimit

			let CanCreateCollection;
			let canCreateProduct;
			let canCreateCommunity;

			if (user.collectionss < collectionlimit) {
				CanCreateCollection = true
				if (user.collectionss.length < productlimit) {
					canCreateProduct = true
				} else {
					canCreateProduct = false
				}
			} else {
				CanCreateCollection = false
			}

			const community = await Community.find({ creator: id })
			if (community.length < communitylimit) {
				canCreateCommunity = true
			} else {
				canCreateCommunity = false
			}
			req.memberships = true
			next()

			console.log("Membership is still valid.");
		} else {
			user.ismembershipactive = false
			await user.save()
			console.log("Membership has expired.");
			res.status(400).json({ success: false })
		}
	} catch (error) {
		res.status(500).json({ success: false })
		console.log(error)
	}
}
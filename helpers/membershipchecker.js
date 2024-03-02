const Membership = require("../models/membership")
const User = require("../models/userAuth")
const Community = require("../models/community")
const Collection = require("../models/Collectionss")

exports.middlewareMembership = async (req, res, next) => {
	try {
		const { userId, comId, colid } = req.params
		const currentDay = Date.now()
		const user = await User.findById(userId)
		const membershipid = user.memberships.membership
		const membership = await Membership.findById(membershipid)
		console.log(membership)
		const membershipEndingDate = new Date(user.memberships.ending);

		if (currentDay < membershipEndingDate.getTime()) {
			if (membership.title !== "Custom") {
				const productlimit = membership.productlimit
				const topiclimit = membership.topiclimit
				const communitylimit = membership.communitylimit
				const collectionlimit = membership.collectionlimit

				let canCreateCollection;
				let canCreateProduct;
				let canCreateCommunity;
				let cancreatetopic;

				if (user.collectionss.length < collectionlimit) {
					canCreateCollection = true

				} else {
					canCreateCollection = false
				}
				const community = await Community.find({ creator: userId })

				if (community.length < communitylimit) {
					canCreateCommunity = true
				} else {
					canCreateCommunity = false
				}
				if (comId) {
					const community = await Community.findById(comId)
					if (community.topics.length < topiclimit) {
						cancreatetopic = true
					} else {
						cancreatetopic = false
					}
				}

				if (colid) {
					const collection = await Collection.findById(colid)
					if (collection) {
						if (collection.products.length < productlimit) {
							canCreateProduct = true
						} else {
							canCreateProduct = false
						}
					}
				}
				req.memberships = true
				req.canCreateCollection = canCreateCollection
				req.canCreateCommunity = canCreateCommunity
				req.canCreateProduct = canCreateProduct
				req.cancreatetopic = cancreatetopic
				next()
			} else {
				console.log("custom hua run")
				const productlimit = user.limits.productlimit
				const topiclimit = user.limits.topiclimit
				const communitylimit = user.limits.communitylimit
				const collectionlimit = user.limits.collectionlimit


				let canCreateCollection;
				let canCreateProduct;
				let canCreateCommunity;
				let cancreatetopic;

				if (user.collectionss.length < collectionlimit) {
					canCreateCollection = true

				} else {
					canCreateCollection = false
				}
				const community = await Community.find({ creator: userId })

				if (community.length < communitylimit) {
					canCreateCommunity = true
				} else {
					canCreateCommunity = false
				}
				if (comId) {
					const community = await Community.findById(comId)
					if (community.topics.length < topiclimit) {
						cancreatetopic = true
					} else {
						cancreatetopic = false
					}
				}

				if (colid) {
					const collection = await Collection.findById(colid)
					if (collection) {
						if (collection.products.length < productlimit) {
							canCreateProduct = true
						} else {
							canCreateProduct = false
						}
					}
				}
				req.memberships = true
				req.canCreateCollection = canCreateCollection
				req.canCreateCommunity = canCreateCommunity
				req.canCreateProduct = canCreateProduct
				req.cancreatetopic = cancreatetopic
				next()
			}
			console.log("Membership is still valid.");
		} else {
			user.ismembershipactive = false
			await user.save()
			console.log("Membership has expired.");
			res.status(203).json({ success: false })
		}
	} catch (error) {
		res.status(400).json({ success: false })
		console.log(error)
	}
}